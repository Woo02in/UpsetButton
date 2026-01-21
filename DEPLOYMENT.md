# AWS 배포 가이드

## 1. 프로덕션 빌드

### 로컬에서 빌드 테스트
```bash
# 전체 빌드
npm run install-all
npm run build

# 서버 실행 (프로덕션 모드)
NODE_ENV=production PORT=3001 node server/index.js
```

## 2. AWS EC2 인스턴스 설정

### 2.1 EC2 인스턴스 생성
1. AWS 콘솔 → EC2 → 인스턴스 시작
2. Ubuntu 22.04 LTS 선택 (또는 Amazon Linux 2023)
3. 인스턴스 유형: t2.micro (무료 티어) 또는 t3.small
4. **키 페어 선택** (키 페어 없이도 가능, 아래 참조)
5. 보안 그룹 설정:
   - 인바운드 규칙:
     - SSH (22): 내 IP (키 페어 없이 사용 시 선택사항)
     - HTTP (80): 0.0.0.0/0
     - HTTPS (443): 0.0.0.0/0
     - 커스텀 TCP (3001): 필요시

### ⚠️ 중요: 데이터베이스 자동 생성
- **SQLite 데이터베이스는 자동으로 생성됩니다**
- 서버를 처음 실행하면 `server/database.db` 파일이 자동으로 생성됩니다
- 테이블(users, clicks)도 서버 시작 시 자동으로 생성됩니다
- 별도의 데이터베이스 서버 설정이나 초기화 작업이 필요 없습니다

### 2.2 EC2에 연결하는 방법

#### 방법 1: 키 페어 사용 (권장 ⭐)
```bash
# Windows (PowerShell)
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# 키 파일 권한 설정 (필수)
# Windows: 파일 속성 → 고급 → 다른 사용자의 읽기 권한 제거
# Linux/Mac: chmod 400 your-key.pem
```

**장점:**
- ✅ 빠르고 안정적
- ✅ SCP로 파일 업로드 가능
- ✅ 자동화 스크립트 작성 용이
- ✅ 표준 방식

#### 방법 2: EC2 Instance Connect (키 페어 없이) 🆕
1. AWS 콘솔 → EC2 → 인스턴스 선택
2. **연결** 버튼 클릭
3. **EC2 Instance Connect** 탭 선택
4. **연결** 클릭 → 브라우저에서 터미널 열림

**장점:**
- ✅ 키 페어 파일 불필요
- ✅ 브라우저에서 바로 접속

**단점/문제점:**
- ❌ 파일 업로드 어려움 (AWS 콘솔 웹 인터페이스 제한적)
- ❌ 자동화 스크립트 작성 어려움
- ❌ SCP 사용 불가
- ❌ 일부 고급 SSH 기능 제한

#### 방법 3: AWS Systems Manager Session Manager (키 페어 없이) 🆕
**사전 설정 필요:**
1. EC2 인스턴스에 IAM 역할 부여:
   - 역할 이름: `EC2-SSM-Role`
   - 정책 연결: `AmazonSSMManagedInstanceCore`
2. SSM Agent 설치 (Amazon Linux 2023, Ubuntu 22.04는 기본 설치됨)

**접속 방법:**
```bash
# AWS CLI 설치 필요
aws ssm start-session --target i-인스턴스ID

# 또는 AWS 콘솔에서
# Systems Manager → Session Manager → 시작 세션
```

**장점:**
- ✅ 키 페어 불필요
- ✅ SSH 포트(22) 열 필요 없음
- ✅ 보안 강화

**단점:**
- ❌ 초기 설정 복잡
- ❌ SCP 사용 불가 (AWS Systems Manager 포트 포워딩 필요)
- ❌ 파일 전송 어려움

### 📋 키 페어 없이 사용할 때의 문제점 요약

| 기능 | 키 페어 있음 | 키 페어 없음 |
|------|------------|------------|
| SSH 접속 | ✅ 쉬움 | ⚠️ 브라우저/SSM 사용 |
| 파일 업로드 (SCP) | ✅ 가능 | ❌ 어려움/불가 |
| 자동화 스크립트 | ✅ 쉬움 | ⚠️ 제한적 |
| 코드 배포 | ✅ Git clone/SCP | ⚠️ Git clone만 가능 |
| 보안 그룹 설정 | ✅ SSH 포트 필요 | ⚠️ Instance Connect는 22 포트 필요, SSM은 불필요 |

**결론:**
- **개인 프로젝트/학습**: 키 페어 사용 권장 (가장 간단)
- **키 파일 관리가 부담스러운 경우**: EC2 Instance Connect (브라우저 접속)
- **엔터프라이즈 환경**: AWS Systems Manager (보안 강화)

### 🎯 키 페어 없이 사용 시 추천 방법

**EC2 Instance Connect 사용 (가장 간단):**
1. EC2 콘솔에서 인스턴스 선택
2. **연결** → **EC2 Instance Connect** → **연결**
3. 브라우저 터미널에서 직접 작업
4. 코드는 Git을 사용하여 배포 (권장)

### 2.3 서버 환경 설정
```bash
# Node.js 설치 (Ubuntu)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git 설치
sudo apt-get update
sudo apt-get install -y git

# PM2 설치 (프로세스 매니저)
sudo npm install -g pm2
```

## 3. 애플리케이션 배포

### 3.1 코드 업로드

#### 키 페어 있는 경우:
```bash
# 방법 1: Git 사용 (권장)
git clone your-repository-url
cd Upset_button

# 방법 2: SCP로 파일 전송
scp -i "your-key.pem" -r . ubuntu@your-ec2-ip:/home/ubuntu/app
```

#### 키 페어 없는 경우 (EC2 Instance Connect 사용):
```bash
# Git 사용 (필수)
# EC2 Instance Connect에서 브라우저 터미널 열기
git clone your-repository-url
cd Upset_button

# 또는 수동으로 파일 복사/붙여넣기 (작은 파일만 가능)
# → CodeDeploy, S3 등 다른 방법 고려
```

**키 페어 없이 사용 시 권장:**
- ✅ **Git 사용** - 코드 변경사항을 Git에 푸시하고 서버에서 pull
- ✅ **AWS CodeDeploy** - 자동 배포 파이프라인 구축 (고급)
- ✅ **S3 + 스크립트** - 코드를 S3에 업로드하고 서버에서 다운로드

### 3.2 의존성 설치 및 빌드
```bash
cd /home/ubuntu/app
npm run install-all
npm run build
```

### 3.3 환경 변수 설정
```bash
# .env 파일 생성 (선택사항)
nano .env

# 또는 직접 환경 변수로 설정
export NODE_ENV=production
export PORT=3001
```

### 3.4 PM2로 서버 실행
```bash
# PM2로 애플리케이션 시작
pm2 start server/index.js --name upset-button

# PM2 설정 저장
pm2 save

# 서버 재부팅 시 자동 시작
pm2 startup
# 위 명령어 실행 후 나온 명령어를 복사해서 실행
```

## 4. Nginx 리버스 프록시 설정 (권장)

### 4.1 Nginx 설치
```bash
sudo apt-get install -y nginx
```

### 4.2 Nginx 설정

**도메인 없이 EC2 IP로 먼저 사용하기:**
```bash
sudo nano /etc/nginx/sites-available/upset-button
```

다음 내용 추가 (EC2 퍼블릭 IP 사용):
```nginx
server {
    listen 80;
    server_name _;  # 모든 도메인/IP 허용
    
    # 또는 특정 IP만 허용하려면:
    # server_name 13.123.45.67;  # EC2 퍼블릭 IP
```

**나중에 도메인 연결할 때:**
```bash
sudo nano /etc/nginx/sites-available/upset-button
```

다음 내용으로 수정:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # React 빌드 파일 제공
    location / {
        root /home/ubuntu/app/client/dist;
        try_files $uri $uri/ /index.html;
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

### 4.3 Nginx 활성화 및 재시작
```bash
sudo ln -s /etc/nginx/sites-available/upset-button /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 5. 도메인 없이 먼저 배포하기 (권장)

**도메인 없이도 배포 가능합니다!**

1. EC2 인스턴스의 **퍼블릭 IP 주소** 확인 (EC2 콘솔에서 확인)
2. 브라우저에서 `http://퍼블릭IP주소` 로 접속
3. 나중에 도메인 구매 후 연결 가능

### Nginx에서 IP 주소 사용 시
```nginx
server {
    listen 80;
    server_name _;  # 모든 호스트 허용
    # 또는
    # server_name 13.123.45.67;  # 특정 IP만 허용
```

### 나중에 도메인 연결 시
1. 도메인 구매 (예: AWS Route 53, 가비아 등)
2. Nginx 설정 파일에서 `server_name` 변경
3. DNS 레코드에 EC2 퍼블릭 IP 등록
4. Nginx 재시작: `sudo systemctl restart nginx`

## 6. SSL 인증서 설정 (HTTPS) - 도메인 필요

**도메인이 있어야 SSL 인증서를 발급받을 수 있습니다.**

### 6.1 Let's Encrypt 인증서 설치
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 6.2 자동 갱신 설정
```bash
sudo certbot renew --dry-run
```

## 7. 도메인 설정 (나중에 연결 가능)

### 7.1 Route 53 설정 (AWS DNS)
1. AWS 콘솔 → Route 53 → 호스팅 영역
2. 도메인 선택 또는 새로 생성
3. A 레코드 생성:
   - 이름: @ (또는 www)
   - 유형: A
   - 값: EC2 인스턴스의 퍼블릭 IP
   - TTL: 300

### 7.2 도메인 네임서버 확인
- Route 53에서 네임서버 주소를 확인
- 도메인 등록 업체에서 네임서버를 Route 53 네임서버로 변경

## 8. 데이터베이스 백업

### 8.1 정기 백업 스크립트
```bash
# backup.sh 파일 생성
nano /home/ubuntu/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp /home/ubuntu/app/server/database.db $BACKUP_DIR/database_$DATE.db
# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "database_*.db" -mtime +30 -delete
```

```bash
chmod +x /home/ubuntu/backup.sh

# Crontab에 등록 (매일 오전 3시)
crontab -e
# 다음 줄 추가:
0 3 * * * /home/ubuntu/backup.sh
```

## 9. 모니터링 및 로그

### 9.1 PM2 모니터링
```bash
pm2 status
pm2 logs upset-button
pm2 monit
```

### 9.2 Nginx 로그
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 10. 업데이트 배포 방법

### 키 페어 있는 경우:
```bash
# 서버에 SSH 접속
ssh -i "your-key.pem" ubuntu@your-ec2-ip

# 코드 업데이트
cd /home/ubuntu/app
git pull  # Git 사용 시

# 재빌드
npm run build

# PM2 재시작
pm2 restart upset-button

# 상태 확인
pm2 status
```

### 키 페어 없는 경우 (EC2 Instance Connect):
1. 로컬에서 Git에 코드 푸시
   ```bash
   git add .
   git commit -m "업데이트"
   git push
   ```

2. AWS 콘솔 → EC2 → Instance Connect로 접속

3. 서버에서 Git pull 및 재빌드
   ```bash
   cd /home/ubuntu/app
   git pull
   npm run build
   pm2 restart upset-button
   pm2 status
   ```

## 11. 트러블슈팅

### 포트 확인
```bash
sudo netstat -tulpn | grep LISTEN
```

### 방화벽 설정
```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 서버 재시작 후 확인
```bash
pm2 status
sudo systemctl status nginx
```

## 비용 예상
- EC2 t2.micro: 무료 티어 (12개월) 또는 월 $8-10
- Route 53: 월 $0.50 (호스팅 영역)
- 데이터 전송: 월 $0.09/GB (처음 1GB 무료)
- **총 예상 비용**: 월 $1-15 (사용량에 따라)

## 보안 체크리스트
- [ ] SSH 키 파일 권한 설정 (chmod 400)
- [ ] 불필요한 포트 닫기
- [ ] 정기적으로 시스템 업데이트
- [ ] 데이터베이스 백업 설정
- [ ] HTTPS 사용 (SSL 인증서)
- [ ] 환경 변수로 민감한 정보 관리
