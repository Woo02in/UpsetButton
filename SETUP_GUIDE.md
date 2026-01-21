# 전체 설정 가이드 - 처음부터 끝까지

이 가이드는 Git 레포지토리 연동부터 AWS EC2 배포까지 모든 단계를 안내합니다.

## 📋 목차
1. [Git 레포지토리 생성 및 연동](#1-git-레포지토리-생성-및-연동)
2. [로컬 프로젝트 Git 초기화](#2-로컬-프로젝트-git-초기화)
3. [코드 커밋 및 푸시](#3-코드-커밋-및-푸시)
4. [AWS EC2 인스턴스 생성](#4-aws-ec2-인스턴스-생성)
5. [EC2 서버 환경 설정](#5-ec2-서버-환경-설정)
6. [애플리케이션 배포](#6-애플리케이션-배포)
7. [Nginx 설정](#7-nginx-설정)
8. [도메인 연결 (선택사항)](#8-도메인-연결-선택사항)

---

## 1. Git 레포지토리 생성 및 연동

### 1.1 GitHub 레포지토리 생성

1. **GitHub 로그인**
   - https://github.com 접속
   - 로그인 (계정이 없으면 회원가입)

2. **새 레포지토리 생성**
   - 우측 상단 **+** 버튼 → **New repository** 클릭
   - Repository name: `Upset_button` (또는 원하는 이름)
   - Description: "속상하다 버튼 웹 애플리케이션"
   - **Public** 또는 **Private** 선택
   - ✅ **Add a README file** 체크 해제 (이미 README.md 있음)
   - ✅ **Add .gitignore** 체크 해제 (이미 .gitignore 있음)
   - **Create repository** 클릭

3. **레포지토리 URL 복사**
   - 생성된 레포지토리 페이지에서
   - **Code** 버튼 클릭
   - HTTPS URL 복사: `https://github.com/사용자명/Upset_button.git`

---

## 2. 로컬 프로젝트 Git 초기화

### 2.1 Git 설치 확인

**Windows PowerShell에서:**
```powershell
git --version
```

Git이 설치되어 있지 않다면:
- https://git-scm.com/download/win 다운로드 및 설치

### 2.2 Git 사용자 정보 설정 (처음 한 번만)

```powershell
git config --global user.name "당신의 이름"
git config --global user.email "당신의이메일@example.com"
```

### 2.3 프로젝트 폴더에서 Git 초기화

```powershell
# 프로젝트 폴더로 이동 (이미 있는 경우)
cd C:\Users\choiwooin\Desktop\Upset_button

# Git 초기화
git init

# 원격 레포지토리 추가
git remote add origin https://github.com/사용자명/Upset_button.git
```

**원격 레포지토리 확인:**
```powershell
git remote -v
```

---

## 3. 코드 커밋 및 푸시

### 3.1 파일 상태 확인

```powershell
git status
```

### 3.2 모든 파일 스테이징

```powershell
git add .
```

### 3.3 첫 커밋

```powershell
git commit -m "Initial commit: 속상하다 버튼 프로젝트"
```

### 3.4 GitHub에 푸시

```powershell
git branch -M main
git push -u origin main
```

**인증이 필요한 경우:**
- GitHub 사용자명과 비밀번호 입력
- 또는 Personal Access Token 사용 (권장)
  - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  - Generate new token → `repo` 권한 선택 → 토큰 생성
  - 비밀번호 대신 토큰 사용

### 3.5 GitHub에서 확인

- 브라우저에서 GitHub 레포지토리 페이지 새로고침
- 모든 파일이 업로드되었는지 확인

---

## 4. AWS EC2 인스턴스 생성

### 4.1 AWS 계정 생성 및 로그인

1. **AWS 회원가입/로그인**
   - https://aws.amazon.com 접속
   - 계정 생성 또는 로그인

2. **EC2 콘솔 접속**
   - AWS 콘솔 → **EC2** 검색 및 클릭

### 4.2 EC2 인스턴스 생성

1. **인스턴스 시작**
   - **인스턴스 시작** 버튼 클릭

2. **이름 및 태그**
   - 이름: `upset-button-server` (선택사항)

3. **애플리케이션 및 OS 이미지(AMI)**
   - **Ubuntu** 검색
   - **Ubuntu Server 22.04 LTS** 선택 (무료 티어 가능)

4. **인스턴스 유형**
   - **t2.micro** 선택 (무료 티어)
   - 또는 **t3.small** (더 좋은 성능, 유료)

5. **키 페어 (로그인)**
   - **새 키 페어 생성** 선택
   - 키 페어 이름: `upset-button-key`
   - 키 페어 유형: **RSA**
   - 프라이빗 키 파일 형식: **.pem** (Windows에서 사용)
   - **키 페어 생성** 클릭
   - ⚠️ **자동으로 다운로드됩니다!** 안전한 곳에 보관하세요

   **또는 키 페어 없이 사용하려면:**
   - 기존 키 페어 선택 또는 "키 페어 없이 계속" (EC2 Instance Connect 사용)

6. **네트워크 설정**
   - 보안 그룹: **새 보안 그룹 생성**
   - 보안 그룹 이름: `upset-button-sg`
   - 인바운드 보안 그룹 규칙:
     - **HTTP (80)**: 소스 유형 `어디서나`
     - **HTTPS (443)**: 소스 유형 `어디서나`
     - **SSH (22)**: 소스 유형 `내 IP` (또는 키 페어 없이 사용 시 선택 안 함)
   - ⚠️ **SSH는 내 IP로만 열어야 보안에 안전합니다**

7. **스토리지 구성**
   - 기본 8GB (무료 티어) 또는 필요에 따라 조정

8. **인스턴스 시작**
   - **인스턴스 시작** 버튼 클릭
   - 확인 메시지 확인

### 4.3 EC2 인스턴스 접속 정보 확인

1. **EC2 대시보드**에서 인스턴스 선택
2. **퍼블릭 IPv4 주소** 복사 (예: `13.123.45.67`)
3. 이 IP 주소가 웹사이트 접속 주소가 됩니다

---

## 5. EC2 서버 환경 설정

### 5.1 EC2에 연결

#### 방법 1: 키 페어 사용 (Windows PowerShell)

```powershell
# 키 파일 위치로 이동
cd C:\Users\choiwooin\Downloads

# 키 파일 권한 설정 (Windows는 보통 필요 없지만)
# 파일 속성 → 보안 → 고급 → 다른 사용자의 읽기 권한 제거

# SSH 접속
ssh -i "upset-button-key.pem" ubuntu@퍼블릭IP주소
```

**첫 접속 시 "호스트를 신뢰할 수 없음" 메시지가 나오면:**
- `yes` 입력 후 Enter

#### 방법 2: EC2 Instance Connect (키 페어 없이)

1. EC2 콘솔 → 인스턴스 선택
2. **연결** 버튼 클릭
3. **EC2 Instance Connect** 탭 선택
4. **연결** 클릭 → 브라우저에서 터미널 열림

### 5.2 서버 환경 설정

```bash
# 시스템 업데이트
sudo apt-get update
sudo apt-get upgrade -y

# Node.js 설치 (Node.js 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Node.js 버전 확인
node --version
npm --version

# Git 설치
sudo apt-get install -y git

# PM2 설치 (프로세스 매니저)
sudo npm install -g pm2

# PM2 버전 확인
pm2 --version
```

---

## 6. 애플리케이션 배포

### 6.1 GitHub에서 코드 클론

```bash
# 홈 디렉토리로 이동
cd ~

# GitHub 레포지토리 클론
git clone https://github.com/사용자명/Upset_button.git

# 프로젝트 폴더로 이동
cd Upset_button

# 파일 확인
ls -la
```

### 6.2 의존성 설치 및 빌드

```bash
# 모든 의존성 설치
npm run install-all

# 프로덕션 빌드
npm run build

# 빌드 확인
ls -la client/dist
```

### 6.3 환경 변수 설정 (선택사항)

```bash
# .env 파일 생성 (필요시)
nano .env
```

다음 내용 추가:
```
NODE_ENV=production
PORT=3001
```

저장: `Ctrl + X` → `Y` → `Enter`

### 6.4 PM2로 서버 실행

```bash
# PM2로 애플리케이션 시작
pm2 start ecosystem.config.js

# 또는 직접 실행
pm2 start server/index.js --name upset-button

# PM2 상태 확인
pm2 status

# PM2 로그 확인
pm2 logs upset-button

# PM2 설정 저장
pm2 save

# 서버 재부팅 시 자동 시작 설정
pm2 startup
# 위 명령어 실행 후 나온 명령어를 복사해서 실행
# 예: sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

### 6.5 서버 테스트

```bash
# 포트 확인
curl http://localhost:3001/api/clicks

# 또는 브라우저에서
# http://퍼블릭IP주소:3001/api/clicks
```

---

## 7. Nginx 설정

### 7.1 Nginx 설치

```bash
sudo apt-get install -y nginx

# Nginx 상태 확인
sudo systemctl status nginx

# Nginx 시작
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 7.2 Nginx 설정 파일 생성

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/upset-button
```

다음 내용 입력 (도메인 없이 IP 사용):
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

    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/ubuntu/Upset_button/client/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

저장: `Ctrl + X` → `Y` → `Enter`

### 7.3 Nginx 설정 활성화

```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/upset-button /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default

# 설정 파일 문법 확인
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx

# Nginx 상태 확인
sudo systemctl status nginx
```

### 7.4 방화벽 설정 (필요시)

```bash
# UFW 방화벽 활성화
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# 방화벽 상태 확인
sudo ufw status
```

### 7.5 웹사이트 접속 확인

브라우저에서 다음 주소로 접속:
```
http://퍼블릭IPv4주소
```

예: `http://13.123.45.67`

✅ 웹사이트가 정상적으로 표시되면 성공!

---

## 8. 도메인 연결 (선택사항)

### 8.1 도메인 구매

1. **도메인 구매처 선택**
   - AWS Route 53
   - 가비아 (Gabia)
   - Namecheap
   - 등등

2. **도메인 구매**
   - 원하는 도메인 이름 검색 및 구매
   - 예: `upsetbutton.com`

### 8.2 DNS 설정

#### AWS Route 53 사용 시:

1. **Route 53 콘솔 접속**
   - AWS 콘솔 → Route 53

2. **호스팅 영역 생성**
   - **호스팅 영역 생성** 클릭
   - 도메인 이름 입력: `upsetbutton.com`
   - **생성** 클릭

3. **A 레코드 생성**
   - **레코드 생성** 클릭
   - 레코드 이름: `@` (루트 도메인) 또는 `www`
   - 레코드 유형: **A**
   - 값/트래픽 라우팅 대상: **단순 라우팅** → **다른 값 정의**
   - IP 주소 입력: EC2 퍼블릭 IPv4 주소
   - **레코드 생성** 클릭

4. **네임서버 설정**
   - Route 53에서 제공하는 네임서버 주소 복사
   - 도메인 등록 업체에서 네임서버를 Route 53 네임서버로 변경
   - 변경 사항 반영까지 몇 시간~최대 48시간 소요

#### 다른 DNS 사용 시:

도메인 등록 업체의 DNS 관리 페이지에서:
- **A 레코드** 추가
- 이름: `@` 또는 `www`
- 값: EC2 퍼블릭 IPv4 주소
- TTL: 300 (5분)

### 8.3 Nginx 설정 업데이트

도메인이 활성화되면:

```bash
sudo nano /etc/nginx/sites-available/upset-button
```

다음으로 변경:
```nginx
server {
    listen 80;
    server_name upsetbutton.com www.upsetbutton.com;  # 도메인 추가
    
    # ... 나머지 설정 동일
}
```

```bash
# 설정 확인 및 재시작
sudo nginx -t
sudo systemctl restart nginx
```

### 8.4 SSL 인증서 설정 (HTTPS)

도메인 연결 후 HTTPS 설정:

```bash
# Certbot 설치
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급 및 설정
sudo certbot --nginx -d upsetbutton.com -d www.upsetbutton.com

# 자동 갱신 테스트
sudo certbot renew --dry-run
```

**이제 https://upsetbutton.com 으로 접속 가능!**

---

## 🔄 업데이트 배포 방법

코드를 수정하고 다시 배포할 때:

### 로컬에서:
```powershell
git add .
git commit -m "업데이트 내용"
git push
```

### EC2 서버에서:
```bash
cd ~/Upset_button
git pull
npm run build
pm2 restart upset-button
pm2 logs upset-button  # 로그 확인
```

---

## 🛠️ 트러블슈팅

### 서버에 접속이 안 될 때
```bash
# PM2 상태 확인
pm2 status

# PM2 로그 확인
pm2 logs upset-button

# 서버 재시작
pm2 restart upset-button
```

### Nginx 오류
```bash
# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# Nginx 설정 문법 확인
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

### 포트 확인
```bash
# 포트 사용 확인
sudo netstat -tulpn | grep LISTEN
```

---

## ✅ 완료 체크리스트

- [ ] GitHub 레포지토리 생성 및 코드 푸시 완료
- [ ] AWS EC2 인스턴스 생성 완료
- [ ] EC2 서버 환경 설정 (Node.js, Git, PM2, Nginx) 완료
- [ ] 애플리케이션 배포 및 실행 완료
- [ ] 웹사이트 접속 확인 완료
- [ ] (선택) 도메인 연결 완료
- [ ] (선택) SSL 인증서 설정 완료

---

## 📞 참고 자료

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 상세한 배포 가이드
- [README.md](./README.md) - 프로젝트 설명

**축하합니다! 🎉 웹사이트가 성공적으로 배포되었습니다!**
