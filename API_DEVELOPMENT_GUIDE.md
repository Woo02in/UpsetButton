# API 개발 가이드

이 프로젝트에서 새 API를 추가할 때 **어디에**, **어떻게** 구현하면 되는지 정리한 문서입니다.

---

## 1. API는 어디에 구현하나요?

**위치: `server/index.js`**

- 모든 API 라우트가 이 파일 안에 있습니다.
- **반드시** `app.get('*', ...)` (React 정적 파일 제공) **위에** 추가해야 합니다.  
  아래에 넣으면 `/api/...` 요청이 React 쪽으로 가서 404가 납니다.

### 현재 API 목록 (참고)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/register` | 회원가입 |
| POST | `/api/login` | 로그인 |
| POST | `/api/click` | 버튼 클릭 기록 |
| GET | `/api/clicks` | 클릭 기록 조회 |
| DELETE | `/api/clicks/:id` | 클릭 기록 삭제 |
| POST | `/api/clicks/fix-timezone` | 기존 기록 시간대 수정 |

---

## 2. 새 API 추가하는 기본 패턴

### 2.1 추가 위치

`server/index.js`에서 **`// 프로덕션 모드에서 React 빌드 파일 제공` 주석보다 위**에 넣습니다.

```javascript
// ✅ 여기 위에 새 API 추가
// app.get('*', ...) 보다 위!

// 프로덕션 모드에서 React 빌드 파일 제공
if (NODE_ENV === 'production') {
  ...
}
```

### 2.2 GET 예시 (조회)

```javascript
// GET /api/예시목록
app.get('/api/예시목록', (req, res) => {
  db.all('SELECT * FROM my_table ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '조회 실패' });
    }
    res.json(rows);
  });
});
```

### 2.3 POST 예시 (생성)

```javascript
// POST /api/예시
app.post('/api/예시', (req, res) => {
  const { name, value } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'name이 필요합니다.' });
  }

  db.run(
    'INSERT INTO my_table (name, value) VALUES (?, ?)',
    [name, value || null],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '등록 실패' });
      }
      res.json({ message: '등록 성공', id: this.lastID });
    }
  );
});
```

### 2.4 PUT/PATCH 예시 (수정)

```javascript
// PUT /api/예시/:id
app.put('/api/예시/:id', (req, res) => {
  const { id } = req.params;
  const { name, value } = req.body;

  db.run(
    'UPDATE my_table SET name = ?, value = ? WHERE id = ?',
    [name, value, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: '수정 실패' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '해당 항목이 없습니다.' });
      }
      res.json({ message: '수정 성공' });
    }
  );
});
```

### 2.5 DELETE 예시 (삭제)

```javascript
// DELETE /api/예시/:id
app.delete('/api/예시/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM my_table WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: '삭제 실패' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: '해당 항목이 없습니다.' });
    }
    res.json({ message: '삭제 성공' });
  });
});
```

---

## 3. 요청 데이터 사용 방법

| 구분 | 사용처 | 예시 |
|------|--------|------|
| **URL 경로 파라미터** | `req.params` | `/api/clicks/:id` → `req.params.id` |
| **쿼리 스트링** | `req.query` | `/api/clicks?user=최우인` → `req.query.user` |
| **JSON body** | `req.body` | POST/PUT body → `req.body.name` |

- `req.body`를 쓰려면 `body-parser`가 필요합니다. 이 프로젝트에는 이미 설정되어 있습니다 (`app.use(bodyParser.json())`).

---

## 4. DB 사용 패턴 (SQLite)

- DB 객체는 파일 상단에서 생성되어 있습니다: `const db = new sqlite3.Database(...)`
- 새 테이블이 필요하면 `db.serialize()` 안의 테이블 생성 부분에 `db.run('CREATE TABLE IF NOT EXISTS ...')` 를 추가합니다.
- 쿼리 시 **반드시 ? 플레이스홀더** 사용 (SQL 인젝션 방지):

```javascript
db.run('INSERT INTO users (name) VALUES (?)', [name], callback);
db.get('SELECT * FROM users WHERE id = ?', [id], callback);
db.all('SELECT * FROM clicks WHERE user_name = ?', [userName], callback);
```

---

## 5. 프론트엔드에서 API 호출

- 개발: Vite proxy 때문에 `/api/...` 로 요청하면 `localhost:3001`로 전달됩니다.
- 프로덕션: Nginx가 `/api` 를 Node 서버로 프록시합니다.

### fetch 예시

```javascript
// GET
const res = await fetch('/api/clicks');
const data = await res.json();

// POST
const res = await fetch('/api/click', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_name: '홍길동', reason: '사유' }),
});
const data = await res.json();

// DELETE
const res = await fetch(`/api/clicks/${id}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_name: currentUser.name }),
});
```

- 경로는 항상 **`/api/...`** 로 시작하면 됩니다.

---

## 6. 새 API 추가 체크리스트

1. [ ] `server/index.js`에서 **`app.get('*', ...)` 블록 위**에 라우트 추가
2. [ ] 경로는 `/api/...` 형태로 통일
3. [ ] `req.params` / `req.query` / `req.body` 로 입력 처리
4. [ ] DB 쿼리 시 `?` 플레이스홀더 사용
5. [ ] 에러 시 `res.status(4xx 또는 5xx).json({ error: '메시지' })` 로 응답
6. [ ] 필요하면 테이블 생성 코드도 같은 파일 상단 `db.serialize()` 안에 추가
7. [ ] 프론트엔드에서 `fetch('/api/...')` 로 호출

---

## 7. 정리

- **구현 위치**: `server/index.js`
- **추가 위치**: `// 프로덕션 모드에서 React 빌드 파일 제공` **위**
- **패턴**: `app.get/post/put/delete('/api/경로', (req, res) => { ... })`
- **DB**: 이미 연결된 `db` 객체로 `db.run`, `db.get`, `db.all` 사용

API를 추가할 때는 위 패턴을 따라서 `server/index.js`에 라우트를 추가하고, 프론트에서는 `/api/...` 로 `fetch` 하면 됩니다.
