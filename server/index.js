const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 데이터베이스 초기화
const db = new sqlite3.Database(path.join(__dirname, 'database.db'));

// 테이블 생성
db.serialize(() => {
  // 사용자 테이블
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // 버튼 클릭 기록 테이블
  db.run(`CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    reason TEXT,
    clicked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_name) REFERENCES users(name)
  )`);
});

// 회원가입
app.post('/api/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '이름과 비밀번호를 입력해주세요.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.run(
      'INSERT INTO users (name, password) VALUES (?, ?)',
      [name, hashedPassword],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint')) {
            return res.status(400).json({ error: '이미 존재하는 이름입니다.' });
          }
          return res.status(500).json({ error: '회원가입 실패' });
        }
        res.json({ message: '회원가입 성공', userId: this.lastID });
      }
    );
  } catch (error) {
    res.status(500).json({ error: '회원가입 실패' });
  }
});

// 로그인
app.post('/api/login', (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: '이름과 비밀번호를 입력해주세요.' });
  }

  db.get('SELECT * FROM users WHERE name = ?', [name], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '로그인 실패' });
    }

    if (!user) {
      return res.status(401).json({ error: '이름 또는 비밀번호가 틀렸습니다.' });
    }

    try {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        res.json({ message: '로그인 성공', user: { id: user.id, name: user.name } });
      } else {
        res.status(401).json({ error: '이름 또는 비밀번호가 틀렸습니다.' });
      }
    } catch (error) {
      res.status(500).json({ error: '로그인 실패' });
    }
  });
});

// 한국 시간 가져오기 함수
const getKoreanTime = () => {
  const now = new Date();
  // UTC 시간을 한국 시간(UTC+9)으로 변환
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  // YYYY-MM-DD HH:mm:ss 형식으로 변환
  const year = koreanTime.getUTCFullYear();
  const month = String(koreanTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(koreanTime.getUTCDate()).padStart(2, '0');
  const hours = String(koreanTime.getUTCHours()).padStart(2, '0');
  const minutes = String(koreanTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(koreanTime.getUTCSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 버튼 클릭 기록
app.post('/api/click', (req, res) => {
  const { user_name, reason } = req.body;

  if (!user_name) {
    return res.status(400).json({ error: '사용자 이름이 필요합니다.' });
  }

  const koreanTime = getKoreanTime();

  db.run(
    'INSERT INTO clicks (user_name, reason, clicked_at) VALUES (?, ?, ?)',
    [user_name, reason || null, koreanTime],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '기록 실패' });
      }
      res.json({ message: '기록 성공', clickId: this.lastID });
    }
  );
});

// 클릭 기록 조회
app.get('/api/clicks', (req, res) => {
  db.all(
    'SELECT * FROM clicks ORDER BY clicked_at DESC',
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: '조회 실패' });
      }
      res.json(rows);
    }
  );
});

// 클릭 기록 삭제 (본인 기록만 삭제 가능)
app.delete('/api/clicks/:id', (req, res) => {
  const { id } = req.params;
  const { user_name } = req.body;

  if (!user_name) {
    return res.status(400).json({ error: '사용자 이름이 필요합니다.' });
  }

  // 먼저 해당 기록이 존재하는지 확인
  db.get(
    'SELECT * FROM clicks WHERE id = ?',
    [id],
    (err, click) => {
      if (err) {
        return res.status(500).json({ error: '삭제 실패' });
      }

      if (!click) {
        return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
      }

      // 최우인은 모든 기록 삭제 가능, 다른 사용자는 본인 기록만 삭제 가능
      if (user_name !== '최우인' && click.user_name !== user_name) {
        return res.status(403).json({ error: '본인의 기록만 삭제할 수 있습니다.' });
      }

      // 삭제 실행
      db.run(
        'DELETE FROM clicks WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '삭제 실패' });
          }
          res.json({ message: '삭제 성공' });
        }
      );
    }
  );
});

// 프로덕션 모드에서 React 빌드 파일 제공 (모든 API 라우트 뒤에 위치)
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  // 모든 라우트를 React 앱으로 (API 제외)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
