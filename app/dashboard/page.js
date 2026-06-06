'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [scripts, setScripts] = useState([])
  const [scriptName, setScriptName] = useState('')
  const [scriptContent, setScriptContent] = useState('')
  const [encryptionKey, setEncryptionKey] = useState('')
  const [output, setOutput] = useState('')
  const [showOutput, setShowOutput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const router = useRouter()

  useEffect(() => {
    loadScripts()
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch('/api/scripts')
      if (res.status === 401) {
        router.push('/')
      }
    } catch (err) {
      router.push('/')
    }
  }

  async function loadScripts() {
    try {
      const res = await fetch('/api/scripts')
      if (res.ok) {
        const data = await res.json()
        setScripts(data.scripts || [])
      }
    } catch (err) {
      console.error('Error loading scripts:', err)
    }
  }

  async function handleUpload(e) {
    e.preventDefault()
    
    if (!scriptName || !scriptContent) {
      showMessage('⚠️ يرجى إدخال اسم السكريبت والمحتوى', 'error')
      return
    }

    if (!encryptionKey || encryptionKey.length < 32) {
      showMessage('⚠️ مفتاح التشفير يجب أن يكون 32 حرفاً على الأقل', 'error')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scriptName,
          content: scriptContent,
          key: encryptionKey
        })
      })

      const data = await res.json()

      if (data.success) {
        showMessage('✅ تم رفع وتشفير السكريبت بنجاح', 'success')
        setScriptName('')
        setScriptContent('')
        loadScripts()
        
        const keys = JSON.parse(localStorage.getItem('scriptKeys') || '{}')
        keys[scriptName] = encryptionKey
        localStorage.setItem('scriptKeys', JSON.stringify(keys))
      } else {
        showMessage('❌ ' + data.error, 'error')
      }
    } catch (err) {
      showMessage('❌ حدث خطأ في الاتصال', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRun(scriptName) {
    const keys = JSON.parse(localStorage.getItem('scriptKeys') || '{}')
    let key = keys[scriptName]
    
    if (!key) {
      key = prompt(`🔑 أدخل مفتاح فك التشفير للسكريبت "${scriptName}":`)
      if (!key) return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptName,
          key: key
        })
      })

      const data = await res.json()

      if (data.success) {
        setOutput(data.output || '✅ تم التشغيل بنجاح (لا يوجد مخرجات)')
        setShowOutput(true)
      } else {
        showMessage('❌ ' + data.error, 'error')
      }
    } catch (err) {
      showMessage('❌ حدث خطأ في تشغيل السكريبت', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(scriptName) {
    if (!confirm(`🗑️ هل أنت متأكد من حذف "${scriptName}"؟`)) return

    try {
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: scriptName })
      })

      const data = await res.json()

      if (data.success) {
        showMessage(`🗑️ تم حذف "${scriptName}"`, 'success')
        loadScripts()
      }
    } catch (err) {
      showMessage('❌ حدث خطأ في الحذف', 'error')
    }
  }

  function showMessage(text, type) {
    setMessage({ text, type })
    setTimeout(() => setMessage({ text: '', type: '' }), 4000)
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">⚡</span>
          <span>Script Vault</span>
        </div>
        <div className="nav-actions">
          <span className="user-badge">👤 المدير</span>
          <button className="btn btn-logout" onClick={() => router.push('/')}>
            🚪 خروج
          </button>
        </div>
      </nav>

      {message.text && (
        <div className={`notification ${message.type}`}>
          {message.text}
        </div>
      )}

      {loading && (
        <div className="loading-screen">
          <div className="loader"></div>
          <span>جاري المعالجة...</span>
        </div>
      )}

      <div className="container">
        <div className="card upload-card">
          <h2>🔐 رفع سكريبت مشفر جديد</h2>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>اسم السكريبت</label>
              <input
                type="text"
                value={scriptName}
                onChange={(e) => setScriptName(e.target.value)}
                placeholder="مثال: scan.sh"
                dir="ltr"
              />
            </div>

            <div className="form-group">
              <label>محتوى السكريبت</label>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="#!/bin/bash&#10;echo 'Hello World'"
                rows="10"
                dir="ltr"
              />
            </div>

            <div className="form-group key-group">
              <label>مفتاح التشفير</label>
              <div className="key-input">
                <input
                  type="text"
                  value={encryptionKey}
                  onChange={(e) => setEncryptionKey(e.target.value)}
                  placeholder="48 حرفاً على الأقل"
                  dir="ltr"
                />
                <button type="button" className="btn btn-small" onClick={() => {
                  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
                  let key = ''
                  const array = new Uint8Array(48)
                  crypto.getRandomValues(array)
                  for (let i = 0; i < 48; i++) {
                    key += chars[array[i] % chars.length]
                  }
                  setEncryptionKey(key)
                }}>
                  🔑 توليد مفتاح
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              🔒 رفع وتشفير
            </button>
          </form>
        </div>

        <div className="card scripts-card">
          <h2>📜 السكريبتات المخزنة</h2>
          <table className="scripts-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الحجم</th>
                <th>التاريخ</th>
                <th>الحالة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {scripts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    لا توجد سكريبتات مرفوعة بعد
                  </td>
                </tr>
              ) : (
                scripts.map(s => (
                  <tr key={s.id}>
                    <td><span className="script-name">🔒 {s.name}</span></td>
                    <td>{s.size}</td>
                    <td>{s.created}</td>
                    <td><span className="status-badge">مشفّر</span></td>
                    <td className="actions">
                      <button className="btn btn-run" onClick={() => handleRun(s.name)}>
                        ▶ تشغيل
                      </button>
                      <button className="btn btn-delete" onClick={() => handleDelete(s.name)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showOutput && (
        <div className="modal" onClick={() => setShowOutput(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📋 نتيجة التشغيل</h3>
              <button className="btn-close" onClick={() => setShowOutput(false)}>✕</button>
            </div>
            <pre className="output">{output || '✅ تم التشغيل بنجاح (لا يوجد مخرجات)'}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
