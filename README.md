# 속상하다 버튼

속상한 감정을 기록하고 공유하는 간단한 웹 애플리케이션입니다.

## 기능

- 간단한 회원가입/로그인 (이름, 비밀번호만)
- 속상한 이유를 적고 버튼 클릭하여 기록
- 사이드패널을 통한 기록 조회
- 본인 기록만 삭제 가능

## 설치 및 실행

### 개발 환경

```bash
# 의존성 설치
npm run install-all

# 개발 서버 실행
npm run dev
```

이 명령은 백엔드 서버(포트 3001)와 프론트엔드 개발 서버(포트 3000)를 동시에 실행합니다.

### 프로덕션 빌드

```bash
# 빌드
npm run build

# 프로덕션 모드로 실행
npm start
```

### PM2로 실행 (프로덕션)

```bash
# PM2로 시작
npm run pm2:start

# 재시작
npm run pm2:restart

# 중지
npm run pm2:stop
```

## 배포

AWS EC2를 사용한 배포 가이드는 [DEPLOYMENT.md](./DEPLOYMENT.md)를 참조하세요.

## 기술 스택

- **프론트엔드**: React, Vite
- **백엔드**: Node.js, Express
- **데이터베이스**: SQLite
- **프로세스 매니저**: PM2

## 프로젝트 구조

```
├── client/          # React 프론트엔드
│   ├── src/
│   └── dist/        # 빌드된 정적 파일 (프로덕션)
├── server/          # Express 백엔드
│   ├── index.js
│   └── database.db  # SQLite 데이터베이스
├── DEPLOYMENT.md    # 배포 가이드
└── package.json
```

## 라이선스

MIT
