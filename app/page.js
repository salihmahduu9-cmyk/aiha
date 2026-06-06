'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) router.push('/dashboard')
      else setError(data.error || 'خطأ في تسجيل الدخول')
    } catch { setError('حدث خطأ في الاتصال') }
    finally { setLoading(false) }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>Script Vault</h1>
          <p className="subtitle">نظام آمن لتشفير وإدارة السكريبتات</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="أدخل اسم المستخدم" required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="أدخل كلمة المرور" required />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'جاري...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  )
}
