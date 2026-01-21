import { useState } from 'react'
import './UpsetButton.css'

function UpsetButton({ user }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_name: user.name,
          reason: reason.trim() || null,
        }),
      })

      if (response.ok) {
        setReason('')
      }
    } catch (err) {
      // 에러 처리 (조용히 실패)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upset-button-container">
      <div className="reason-input-wrapper">
        <input
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="속상한 이유 "
          className="reason-input"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !loading) {
              handleClick()
            }
          }}
        />
      </div>
      <button
        className={`upset-button ${loading ? 'loading' : ''}`}
        onClick={handleClick}
        disabled={loading}
        aria-label="속상하다"
      >
      </button>
    </div>
  )
}

export default UpsetButton
