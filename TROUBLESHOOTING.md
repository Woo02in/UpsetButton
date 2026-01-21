# 500 Internal Server Error 해결 가이드

## 문제 진단 단계

### 1. PM2 서버 상태 확인

EC2 서버에 접속 후:

```bash
# PM2 상태 확인
pm2 status

# PM2 로그 확인 (에러 메시지 확인)
pm2 logs upset-button --lines 50

# 또는 실시간 로그
pm2 logs upset-button
```

**예상 문제:**
- 서버가 실행되지 않음 → `pm2 start server/index.js --name upset-button`
- 에러 메시지 확인 필요

### 2. Node.js 서버가 포트 3001에서 실행 중인지 확인

```bash
# 포트 3001 사용 확인
sudo netstat -tulpn | grep 3001

# 또는
sudo ss -tulpn | grep 3001

# 서버 직접 테스트
curl http://localhost:3001/api/clicks

# 응답이 없으면 서버가 실행되지 않은 것
```

### 3. Nginx 에러 로그 확인

```bash
# Nginx 에러 로그 확인 (가장 중요!)
sudo tail -f /var/log/nginx/error.log

# 최근 에러 확인
sudo tail -n 50 /var/log/nginx/error.log
```

**예상 에러:**
- `connect() failed (111: Connection refused)` → 백엔드 서버가 실행되지 않음
- `Permission denied` → 파일 권한 문제
- `No such file or directory` → 경로 문제

### 4. Nginx 설정 파일 확인

```bash
# 설정 파일 확인
sudo nano /etc/nginx/sites-available/upset-button

# 설정 문법 확인
sudo nginx -t
```

### 5. 빌드 파일 존재 확인

```bash
# React 빌드 파일 확인
ls -la ~/Upset_button/client/dist

# index.html이 있어야 함
ls -la ~/Upset_button/client/dist/index.html
```

빌드 파일이 없으면:
```bash
cd ~/Upset_button
npm run build
```

---

## 일반적인 해결 방법

### 해결 방법 1: 서버 재시작

```bash
# PM2 서버 재시작
pm2 restart upset-button

# 또는 완전히 중지 후 시작
pm2 stop upset-button
pm2 start server/index.js --name upset-button
pm2 save

# Nginx 재시작
sudo systemctl restart nginx
```

### 해결 방법 2: Nginx 설정 파일 수정

```bash
sudo nano /etc/nginx/sites-available/upset-button
```

**올바른 설정 (IP 주소 사용 시):**

```nginx
server {
    listen 80;
    server_name _;  # 모든 호스트 허용

    # React 빌드 파일 제공
    location / {
        root /home/ubuntu/Upset_button/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }

    # API 요청을 Node.js 서버로 프록시
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**중요 체크 포인트:**
- `root` 경로가 정확한지 확인: `/home/ubuntu/Upset_button/client/dist`
- `proxy_pass`가 `http://localhost:3001`로 설정되어 있는지 확인
- 프로젝트 폴더 이름이 다르면 경로 수정 필요

### 해결 방법 3: 프로젝트 경로 확인 및 수정

```bash
# 현재 프로젝트 경로 확인
pwd

# 프로젝트 폴더 이름 확인
ls -la ~
```

프로젝트가 다른 경로에 있다면:
1. 실제 경로 확인
2. Nginx 설정 파일에서 경로 수정

### 해결 방법 4: 파일 권한 확인

```bash
# 빌드 파일 권한 확인
ls -la ~/Upset_button/client/dist

# 권한 부여 (필요시)
sudo chown -R ubuntu:ubuntu ~/Upset_button
chmod -R 755 ~/Upset_button/client/dist
```

### 해결 방법 5: Node.js 서버 직접 실행 테스트

```bash
cd ~/Upset_button
NODE_ENV=production PORT=3001 node server/index.js
```

다른 터미널에서:
```bash
curl http://localhost:3001/api/clicks
```

**응답이 오면:** 서버는 정상, Nginx 설정 문제
**응답이 없으면:** 서버 코드 문제, 에러 메시지 확인

---

## 단계별 진단 체크리스트

```bash
# 1. PM2 서버 실행 확인
pm2 status
# ✅ upset-button이 online이어야 함

# 2. 포트 3001 확인
sudo netstat -tulpn | grep 3001
# ✅ LISTEN 상태여야 함

# 3. 로컬 API 테스트
curl http://localhost:3001/api/clicks
# ✅ JSON 응답이 와야 함

# 4. 빌드 파일 확인
ls -la ~/Upset_button/client/dist/index.html
# ✅ 파일이 존재해야 함

# 5. Nginx 설정 문법 확인
sudo nginx -t
# ✅ "syntax is ok" 메시지가 나와야 함

# 6. Nginx 에러 로그 확인
sudo tail -n 20 /var/log/nginx/error.log
# ❌ 에러 메시지가 없어야 함
```

---

## 빠른 해결 스크립트

전체 재설정:

```bash
# 1. 프로젝트 폴더로 이동
cd ~/Upset_button

# 2. PM2 중지
pm2 stop upset-button
pm2 delete upset-button

# 3. 재빌드
npm run build

# 4. PM2 시작
pm2 start ecosystem.config.js
pm2 save

# 5. Nginx 설정 확인
sudo nginx -t

# 6. Nginx 재시작
sudo systemctl restart nginx

# 7. 상태 확인
pm2 status
curl http://localhost:3001/api/clicks
```

---

## 추가 디버깅

### 실제 에러 메시지 확인

브라우저 개발자 도구(F12) → Network 탭에서:
- 실패한 요청 클릭
- Response 탭에서 실제 에러 메시지 확인

### Nginx 액세스 로그 확인

```bash
sudo tail -f /var/log/nginx/access.log
```

브라우저에서 새로고침하면 로그에 요청이 기록됨

### 환경 변수 확인

```bash
# PM2 환경 변수 확인
pm2 env upset-button

# 서버에서 직접 확인
cd ~/Upset_button
echo $NODE_ENV
echo $PORT
```

---

## 여전히 해결되지 않으면

에러 로그를 확인하고 다음 정보를 확인하세요:

```bash
# 모든 로그 수집
pm2 logs upset-button --lines 100 > /tmp/pm2_logs.txt
sudo tail -n 100 /var/log/nginx/error.log > /tmp/nginx_error.txt

# 로그 확인
cat /tmp/pm2_logs.txt
cat /tmp/nginx_error.txt
```

위 로그의 에러 메시지를 알려주시면 더 정확한 해결 방법을 제시할 수 있습니다.
