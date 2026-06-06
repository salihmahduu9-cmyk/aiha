const crypto = require('crypto')

const scripts = new Map()

function storeScript(name, encryptedContent, key) {
  const id = crypto.randomBytes(16).toString('hex')
  scripts.set(id, { id, name, encryptedContent, key, created: Date.now(), size: Buffer.from(encryptedContent, 'base64').length })
  return id
}

function getScript(id) { return scripts.get(id) || null }

function listScripts() {
  const list = []
  for (const [id, script] of scripts) {
    list.push({ id: script.id, name: script.name, size: formatSize(script.size), created: new Date(script.created).toLocaleDateString('ar-SA'), status: 'مشفّر' })
  }
  return list
}

function deleteScript(id) { return scripts.delete(id) }

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

module.exports = { storeScript, getScript, listScripts, deleteScript }
