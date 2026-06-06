const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const users = new Map()
const sessions = new Map()

async function initAuth() {
  const username = process.env.ADMIN_USERNAME || 'admin'
  const password = process.env.ADMIN_PASSWORD || 'Admin@123456'
  const hashedPassword = await bcrypt.hash(password, 12)
  users.set(username, { username, password: hashedPassword, role: 'admin', created: Date.now() })
}

async function login(username, password) {
  const user = users.get(username)
  if (!user) return null
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return null
  const sessionId = crypto.randomBytes(32).toString('hex')
  sessions.set(sessionId, { username, role: user.role, created: Date.now(), expires: Date.now() + (24 * 60 * 60 * 1000) })
  return sessionId
}

function getSession(sessionId) {
  const session = sessions.get(sessionId)
  if (!session) return null
  if (Date.now() > session.expires) { sessions.delete(sessionId); return null }
  return session
}

function logout(sessionId) { sessions.delete(sessionId) }

module.exports = { initAuth, login, getSession, logout }
