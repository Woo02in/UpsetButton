import { useState, useEffect } from 'react'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import UpsetButton from './components/UpsetButton'
import SidePanel from './components/SidePanel'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [sidePanelOpen, setSidePanelOpen] = useState(false)

  useEffect(() => {
    // 로컬 스토리지에서 사용자 정보 확인
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <div className="app">
      {!user ? (
        <div className="auth-container">
          {showRegister ? (
            <RegisterForm
              onRegister={handleLogin}
              onSwitchToLogin={() => setShowRegister(false)}
            />
          ) : (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowRegister(true)}
            />
          )}
        </div>
      ) : (
        <>
          <header className="header">
            <div className="header-content">
              <span className="user-name">안녕하세요, {user.name}님</span>
              <button className="logout-btn" onClick={handleLogout}>
                로그아웃
              </button>
              <button
                className="history-btn"
                onClick={() => setSidePanelOpen(!sidePanelOpen)}
              >
                기록 보기
              </button>
            </div>
          </header>
          <UpsetButton user={user} />
          <SidePanel
            isOpen={sidePanelOpen}
            onClose={() => setSidePanelOpen(false)}
            currentUser={user}
          />
        </>
      )}
    </div>
  )
}

export default App
