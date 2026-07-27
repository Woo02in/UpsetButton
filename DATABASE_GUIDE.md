# 데이터베이스 연동 및 구조 가이드

## 1. 데이터베이스 연동 방식

### 사용 기술: SQLite (파일 기반)

- **별도 DB 서버 없음**  
  MySQL, PostgreSQL 같은 전용 DB 서버를 쓰지 않습니다.
- **파일 하나가 DB**  
  `server/database.db` 한 파일이 전체 데이터베이스입니다.
- **Node.js에서 직접 접속**  
  Express 서버(`server/index.js`)가 같은 서버 안의 `database.db` 파일을 열어서 사용합니다.

### 연동 코드 위치

**파일:** `server/index.js`

```javascript
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 데이터베이스 파일 경로: server/database.db
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));
```

- `__dirname` = `server` 폴더 경로
- 따라서 DB 파일 경로 = **`server/database.db`**
- 서버가 처음 실행될 때 이 파일이 없으면 SQLite가 **자동으로 생성**합니다.

### 데이터베이스가 “어디 서버에 어떻게 올라가 있는지”

| 구분 | 설명 |
|------|------|
| **위치** | **애플리케이션과 같은 서버(EC2 인스턴스)** 안에 있음 |
| **경로** | EC2 기준: `/home/ubuntu/UpsetButton/server/database.db` |
| **올라가는 방식** | 코드를 EC2에 배포할 때 `server/` 폴더가 같이 올라가고, **DB 파일은 서버에서 서버 실행 시 자동 생성**됨 (Git에는 포함 안 됨) |
| **백업** | 이 한 파일(`database.db`)을 복사하면 전체 DB 백업 |

즉, **별도 DB 서버가 있는 게 아니라 “우리 앱이 돌아가는 EC2 서버 한 대 안에 SQLite 파일 하나”가 있는 구조**입니다.

---

## 2. 프로젝트 파일 구조 (DB 관련)

```
Upset_button/
├── server/
│   ├── index.js          ← Express + SQLite 연동, API, 테이블 생성
│   └── database.db       ← SQLite DB 파일 (실행 시 자동 생성, Git 제외)
├── client/               ← React 프론트 (DB 직접 접근 안 함)
├── package.json
└── .gitignore            ← server/database.db, *.db 제외
```

- **DB를 다루는 코드:** `server/index.js` 한 곳
- **DB 파일:** `server/database.db` (로컬/EC2 모두 동일한 상대 경로)
- **Git:** `database.db`는 `.gitignore`에 있어서 저장소에는 올라가지 않음

---

## 3. 테이블 구조 (SQL로 파악)

### 3.1 스키마 확인하는 SQL

DB에 접속한 뒤 아래 SQL로 구조를 파악할 수 있습니다.

```sql
-- 테이블 목록
.tables

-- users 테이블 구조
.schema users

-- clicks 테이블 구조
.schema clicks
```

### 3.2 실제 테이블 정의 (server/index.js 기준)

**users (사용자)**

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | 자동 증가 PK |
| name | TEXT | 로그인 아이디(이름), 중복 불가 |
| password | TEXT | bcrypt 해시된 비밀번호 |
| created_at | DATETIME | 가입 시각 |

**clicks (속상하다 버튼 기록)**

```sql
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  reason TEXT,
  clicked_at DATETIME,
  FOREIGN KEY (user_name) REFERENCES users(name)
);
```

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | INTEGER | 자동 증가 PK |
| user_name | TEXT | 누가 눌렀는지 (users.name 참조) |
| reason | TEXT | 속상한 이유 (선택) |
| clicked_at | DATETIME | 기록 시각 (한국 시간으로 저장) |

---

## 4. SQL로 데이터 파악하는 방법

### 4.1 DB 접속 (로컬 또는 EC2)

**로컬 (프로젝트 루트 기준):**

```bash
cd server
sqlite3 database.db
```

**EC2:**

```bash
cd ~/UpsetButton/server
sqlite3 database.db
```

### 4.2 자주 쓰는 파악용 SQL

```sql
-- 사용자 수
SELECT COUNT(*) FROM users;

-- 사용자 목록 (비밀번호 제외)
SELECT id, name, created_at FROM users;

-- 클릭 기록 수
SELECT COUNT(*) FROM clicks;

-- 최근 클릭 10개
SELECT id, user_name, reason, clicked_at
FROM clicks
ORDER BY clicked_at DESC
LIMIT 10;

-- 사용자별 클릭 횟수
SELECT user_name, COUNT(*) AS cnt
FROM clicks
GROUP BY user_name
ORDER BY cnt DESC;

-- 특정 사용자 기록
SELECT * FROM clicks WHERE user_name = '최우인' ORDER BY clicked_at DESC;
```

### 4.3 한 줄 명령으로 실행 (접속 없이)

```bash
# 로컬
sqlite3 server/database.db "SELECT id, user_name, clicked_at FROM clicks ORDER BY id DESC LIMIT 5;"

# EC2
sqlite3 ~/UpsetButton/server/database.db "SELECT id, user_name, clicked_at FROM clicks ORDER BY id DESC LIMIT 5;"
```

---

## 5. 요약

| 항목 | 내용 |
|------|------|
| **DB 종류** | SQLite (파일 DB) |
| **연동** | `server/index.js`에서 `sqlite3`로 `server/database.db` 열기 |
| **DB 파일 위치** | 프로젝트: `server/database.db` / EC2: `/home/ubuntu/UpsetButton/server/database.db` |
| **서버에 올라가는 방식** | EC2에 앱 배포 시 `server/` 폴더가 올라가고, **DB 파일은 그 서버에서 앱 실행 시 자동 생성** (별도 DB 서버 없음) |
| **스키마 파악** | `sqlite3 database.db` 접속 후 `.schema 테이블명` 또는 위 CREATE TABLE 참고 |
| **데이터 파악** | 동일하게 `sqlite3` 접속 후 SELECT 쿼리 실행 |

---

## 6. DB 파일과 업데이트/동기화 관계

### DB 파일은 Git에 없음

- `server/database.db`는 **.gitignore에 포함**되어 있어서 GitHub에는 올라가지 않습니다.
- 따라서 `git pull`로 **코드만** 가져오는 것이지, **DB 파일은 가져오거나 덮어쓰지 않습니다.**

### 실제 동작 구조

| 상황 | 동작 |
|------|------|
| **웹에서 회원가입/버튼 클릭** | 브라우저 → EC2 API 요청 → Node(Express)가 **같은 서버의 database.db에 바로 기록** → 파일이 그 자리에서 갱신됨 |
| **배포 업데이트 (git pull, build, pm2 restart)** | **코드만** 교체됨. database.db는 그대로 두고, 기존 데이터 유지 |
| **동기화** | DB는 서버 한 대에만 있으므로, 다른 곳과 동기화하는 개념 없음. 웹에서 입력하면 그 서버의 DB 파일이 바로 갱신됨 |

### 정리

- **웹에서 누가 데이터를 추가하면**  
  API가 EC2에서 실행되고, **그 EC2 안의 server/database.db 파일이 바로 수정**됩니다.  
  별도의 "동기화" 과정은 없고, **한 서버, 한 파일**이 실시간으로 갱신되는 구조입니다.

- **업데이트(배포)할 때**  
  `git pull` + `npm run build` + `pm2 restart`는 **코드만** 바꿉니다.  
  **DB 파일은 자동 백업·자동 동기화되지 않습니다.**  
  백업이 필요하면 별도로 스크립트(cron 등)를 두어 database.db를 복사해야 합니다.

---

이 문서만 보면 “데이터베이스 연동이 어떻게 되어 있는지”, “파일 구조와 SQL로 DB를 어떻게 파악하는지”, “DB가 어디 서버에 어떻게 올라가 있는지”까지 한 번에 정리할 수 있습니다.
