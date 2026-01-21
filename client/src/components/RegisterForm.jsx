import { useState } from 'react'
import './RegisterForm.css'

function RegisterForm({ onRegister, onSwitchToLogin }) {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // 회원가입 성공 후 자동 로그인
        const loginResponse = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, password }),
        })

        const loginData = await loginResponse.json()
        if (loginResponse.ok) {
          onRegister(loginData.user)
        }
      } else {
        setError(data.error || '회원가입 실패')
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="register-form-container">
      <div className="register-card">
        <h1 className="register-title">속상한 회원가입</h1>
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="reg-name">이름</label>
            <input
              id="reg-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reg-password">비밀번호</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>
        <div className="switch-form">
          <span>이미 계정이 있으신가요? </span>
          <button onClick={onSwitchToLogin} className="switch-btn">
            로그인
          </button>
        </div>
      </div>
    </div>
  )
}

export default RegisterForm
