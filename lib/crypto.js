const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

function encryptScript(scriptContent, secretKey) {
  // طبقة 1: Base64
  const b64Content = Buffer.from(scriptContent, 'utf-8').toString('base64')
  
  // طبقة 2: XOR
  const xored = layer1XorChaos(Buffer.from(b64Content, 'utf-8'), secretKey)
  
  // طبقة 3: Shuffle
  const shuffled = layer2Shuffle(xored)
  
  // طبقة 4: Junk bytes
  const withJunk = layer3InsertJunk(shuffled)
  
  // طبقة 5: AES-256-GCM
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = crypto.createHash('sha256').update(secretKey).digest()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  const encrypted = Buffer.concat([cipher.update(withJunk), cipher.final()])
  const tag = cipher.getAuthTag()
  
  const payload = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
    algo: 'AES-256-GCM+XOR+SHUFFLE+JUNK',
    version: '3.0',
    timestamp: Date.now()
  }
  
  return Buffer.from(JSON.stringify(payload)).toString('base64')
}

function decryptScript(encryptedPayload, secretKey) {
  try {
    const payload = JSON.parse(Buffer.from(encryptedPayload, 'base64').toString('utf-8'))
    if (!payload || payload.algo !== 'AES-256-GCM+XOR+SHUFFLE+JUNK') throw new Error('تنسيق غير صحيح')
    
    const iv = Buffer.from(payload.iv, 'base64')
    const tag = Buffer.from(payload.tag, 'base64')
    const data = Buffer.from(payload.data, 'base64')
    const key = crypto.createHash('sha256').update(secretKey).digest()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
    const cleaned = layer3RemoveJunk(decrypted)
    const unshuffled = layer2Shuffle(cleaned)
    const debased = layer1XorChaos(unshuffled, secretKey)
    const original = Buffer.from(debased.toString('utf-8'), 'base64').toString('utf-8')
    
    return original
  } catch (error) {
    throw new Error('فشل فك التشفير: ' + error.message)
  }
}

function layer1XorChaos(data, key) {
  const keyLen = key.length
  const result = Buffer.alloc(data.length)
  for (let i = 0; i < data.length; i++) {
    const k1 = key.charCodeAt((i % keyLen))
    const k2 = key.charCodeAt(((i + 3) % keyLen))
    const k3 = key.charCodeAt(((i * 7) % keyLen))
    let byte = data[i] ^ k1 ^ k2 ^ k3
    byte = (byte + 17) % 256
    result[i] = byte
  }
  return result
}

function layer2Shuffle(data) {
  const mid = Math.floor(data.length / 2)
  const first = data.slice(0, mid)
  const second = data.slice(mid)
  return Buffer.concat([second.reverse(), first.reverse()])
}

function layer3InsertJunk(data) {
  const junkChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  const result = []
  let counter = 0
  for (let i = 0; i < data.length; i++) {
    if (counter >= 3) {
      result.push(junkChars.charCodeAt(Math.floor(Math.random() * junkChars.length)))
      counter = 0
    }
    result.push(data[i])
    counter++
  }
  return Buffer.from(result)
}

function layer3RemoveJunk(data) {
  const result = []
  let counter = 0
  for (let i = 0; i < data.length; i++) {
    if (counter === 3) { counter = 0 }
    else { result.push(data[i]); counter++ }
  }
  return Buffer.from(result)
}

function generateKey(length = 48) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
  let key = ''
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) key += chars[randomBytes[i] % chars.length]
  return key
}

function validateKey(key) {
  if (key.length < 32) return { valid: false, message: 'المفتاح يجب أن يكون 32 حرفاً على الأقل' }
  const hasUpper = /[A-Z]/.test(key)
  const hasLower = /[a-z]/.test(key)
  const hasDigit = /[0-9]/.test(key)
  const hasSpecial = /[^A-Za-z0-9]/.test(key)
  if (!(hasUpper && hasLower && hasDigit && hasSpecial)) return { valid: false, message: 'المفتاح يجب أن يحتوي على: حروف كبيرة، صغيرة، أرقام، رموز' }
  return { valid: true, message: 'مفتاح قوي' }
}

module.exports = { encryptScript, decryptScript, generateKey, validateKey }
