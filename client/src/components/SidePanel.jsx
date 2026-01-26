import { useState, useEffect } from 'react'
import './SidePanel.css'

function SidePanel({ isOpen, onClose, currentUser }) {
  const [clicks, setClicks] = useState([])
  const [loading, setLoading] = useState(false)
  const [collapsed, setCollapsed] = useState({})

  useEffect(() => {
    if (isOpen) {
      fetchClicks()
    }
  }, [isOpen])

  const fetchClicks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/clicks')
      const data = await response.json()
      setClicks(data)
    } catch (err) {
      console.error('기록 조회 실패:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  // 사용자별로 그룹화
  const groupedClicks = clicks.reduce((acc, click) => {
    const userName = click.user_name
    if (!acc[userName]) {
      acc[userName] = []
    }
    acc[userName].push(click)
    return acc
  }, {})

  const toggleCollapse = (userName) => {
    setCollapsed(prev => ({
      ...prev,
      [userName]: !prev[userName]
    }))
  }

  const handleDelete = async (clickId) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/clicks/${clickId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: currentUser.name,
        }),
      })

      if (response.ok) {
        // 삭제 후 목록 새로고침
        fetchClicks()
      } else {
        const data = await response.json()
        alert(data.error || '삭제 실패')
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <>
      {isOpen && <div className="side-panel-overlay" onClick={onClose} />}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="side-panel-header">
          <h2>속상한 기록</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="side-panel-content">
          {loading ? (
            <div className="loading-message">로딩 중...</div>
          ) : clicks.length === 0 ? (
            <div className="empty-message">아직 기록이 없습니다.</div>
          ) : (
            <div className="clicks-list">
              {Object.entries(groupedClicks).map(([userName, userClicks]) => (
                <div key={userName} className="user-group">
                  <div 
                    className="user-group-header" 
                    onClick={() => toggleCollapse(userName)}
                  >
                    <div className="user-group-title">
                      <span className={`toggle-icon ${collapsed[userName] ? 'collapsed' : ''}`}>
                        {collapsed[userName] ? '▶' : '▼'}
                      </span>
                      <span className="user-group-name">{userName}</span>
                    </div>
                    <span className="user-group-count">{userClicks.length}회</span>
                  </div>
                  {!collapsed[userName] && (
                    <div className="user-clicks">
                      {userClicks.map((click) => (
                        <div key={click.id} className="click-item">
                          <div className="click-header">
                            <span className="click-date">{formatDate(click.clicked_at)}</span>
                            {currentUser && (click.user_name === currentUser.name || currentUser.name === '최우인') && (
                              <button
                                className="delete-btn"
                                onClick={() => handleDelete(click.id)}
                                title="삭제"
                              >
                                ×
                              </button>
                            )}
                          </div>
                          {click.reason && (
                            <div className="click-reason">{click.reason}</div>
                          )}
                          {!click.reason && (
                            <div className="click-reason no-reason">사유 없음</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default SidePanel
