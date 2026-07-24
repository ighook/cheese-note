# Chzzk Time Marker

치지직 라이브 또는 다시보기를 보다가 원하는 시점에 메모를 남기는
Chrome 확장프로그램입니다.

## 사용 준비

채널 정보는 치지직 공식 Open API로 조회합니다.

1. [치지직 Developers](https://developers.chzzk.naver.com/)에서 애플리케이션을 등록합니다.
2. 확장프로그램 팝업의 **치지직 API 설정**을 엽니다.
3. 발급받은 Client ID와 Client Secret을 저장합니다.
4. `https://chzzk.naver.com/*`에서 영상을 재생하고 `G` 키를 누릅니다.

인증 정보는 확장프로그램의 로컬 저장소에만 저장됩니다. 다만 브라우저
확장프로그램에는 비밀을 완전히 숨길 수 있는 서버 경계가 없으므로, 배포용
서비스에서는 Client Secret을 보관하고 API를 대신 호출할 백엔드가 필요합니다.

## 채널 조회 구조

1. 콘텐츠 스크립트가 현재 페이지에서 채널 ID와 방송 누적 진행 시간을 읽습니다.
2. 채널 ID를 백그라운드 스크립트에 전달합니다.
3. 백그라운드 스크립트가
   `GET https://openapi.chzzk.naver.com/open/v1/channels`를 호출합니다.
4. 공식 API가 반환한 채널 ID와 채널명을 메모에 저장합니다.

채널 조회 요청에는 `channelIds`, `Client-Id`, `Client-Secret`이 사용됩니다.

## 주요 기능

- 치지직 영상 화면에서 `G` 키로 메모 작성
- 방송 시작 후 누적 진행 시간을 `HH:MM:SS` 형식으로 저장
- 공식 Open API 기반 채널 식별
- 채널별 메모 조회, 수정, 삭제
- JSON 가져오기와 내보내기
- Chrome extension local storage 저장

## 기술 스택

- WXT
- React
- TypeScript
