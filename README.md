# 정책제안 AI 상황실

주제를 입력하면 9개 역할의 AI 에이전트(PM, 정책·과제 리서처, 재정·예산 전문가, 산업·기업 발굴가,
데이터·예측 분석가, 추진체계 설계자, 해외 R&D·기술예측 분석가, 교차검증·협업 조정관, 작성·검토자)가
협업하여 정책제안서/국책과제 기획 초안을 작성하는 웹앱입니다.

## 구조

- `index.html` — 프런트엔드 전체 (정적 파일, 별도 빌드 과정 없음)
- `api/sample.js` — Vercel Edge Function. 브라우저의 요청을 받아 Anthropic API를 호출하고,
  응답을 스트리밍으로 돌려줍니다. API 키는 서버에만 보관되어 브라우저에 노출되지 않습니다.

## 로컬에서 보기만 할 때

`index.html`을 더블클릭해 열어도 화면은 보이지만, `/api/sample`을 호출하는 서버가 없어서
AI 요원 호출은 동작하지 않습니다. 실제로 동작하는 모습을 보려면 아래 Vercel 배포가 필요합니다.

## Vercel 배포 방법

1. 이 저장소를 GitHub에 올립니다 (이미 올라와 있다면 생략).
2. https://vercel.com 에 로그인 → **Add New → Project** → 방금 올린 GitHub 저장소를 선택해
   **Import** 합니다. Framework Preset은 "Other"로 자동 인식되며 별도 설정 없이 바로 배포됩니다.
3. 배포가 시작되기 전(또는 배포 후) 프로젝트의 **Settings → Environment Variables**에서
   다음을 추가합니다.

   | Key | Value |
   |---|---|
   | `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/settings/keys) 에서 발급받은 API 키 |
   | `ANTHROPIC_MODEL` | (선택) 예: `claude-sonnet-4-5-20250929`. 비워두면 기본값이 사용됩니다. |

4. 환경변수를 추가한 뒤 **Deployments** 탭에서 최신 배포를 **Redeploy** 하면 적용됩니다.
5. 배포된 URL로 접속해 주제를 입력하고 "전 요원 투입"을 눌러 정상 동작하는지 확인하세요.

## 주의사항

- `ANTHROPIC_API_KEY`는 절대 `index.html`이나 저장소에 직접 적지 말고, 반드시 Vercel의
  Environment Variables로만 등록하세요. 코드에 직접 넣으면 브라우저에 그대로 노출됩니다.
- Anthropic API는 사용량에 따라 과금됩니다. 공개 배포 시 호출량 제한(rate limit)이나
  인증 단계를 추가하는 것을 권장합니다 (이 템플릿에는 포함되어 있지 않습니다).
- 이 앱이 생성하는 모든 조사 결과·예산·법령 수치는 AI가 그 자리에서 생성한 시뮬레이션이며
  실제 공공 데이터베이스와 연동되어 있지 않습니다. 반드시 원문 출처로 재검증한 뒤 사용하세요.
