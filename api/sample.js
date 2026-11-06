export const config = { runtime: 'edge' };

const ALLOWED_ORIGIN = '*'; // same-origin deployment; tighten if you add a custom domain allowlist

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response('Bad request: invalid JSON', { status: 400 });
  }

  const prompt = body && body.prompt;
  if (!prompt || typeof prompt !== 'string') {
    return new Response('Bad request: missing prompt', { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response('서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다. Vercel 프로젝트 설정 > Environment Variables에서 추가하세요.', { status: 500 });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5-20250929';

  let upstream;
  try {
    upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2048,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (e) {
    return new Response('Upstream request failed: ' + (e && e.message), { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => '');
    const status = upstream.status === 429 ? 429 : 502;
    return new Response('Upstream error (' + upstream.status + '): ' + errText, { status: status });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buf = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop();
          for (const line of lines) {
            if (!line.startsWith('data:')) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const evt = JSON.parse(data);
              if (evt.type === 'content_block_delta' && evt.delta && evt.delta.type === 'text_delta') {
                controller.enqueue(encoder.encode(evt.delta.text));
              } else if (evt.type === 'error') {
                controller.enqueue(encoder.encode('\n[오류] ' + (evt.error && evt.error.message || 'unknown error')));
              }
            } catch (e) {
              // ignore malformed SSE chunk fragments
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'access-control-allow-origin': ALLOWED_ORIGIN,
    },
  });
}
