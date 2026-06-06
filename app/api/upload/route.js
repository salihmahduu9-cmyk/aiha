import { getSession } from '@/lib/auth'
import { encryptScript, validateKey, generateKey } from '@/lib/crypto'
import { storeScript, deleteScript } from '@/lib/store'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const sessionId = cookies().get('session')?.value
  if (!getSession(sessionId)) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { name, content, key } = await request.json()
  if (!name || !content) return NextResponse.json({ error: 'الاسم والمحتوى مطلوبان' }, { status: 400 })

  const encryptionKey = key || generateKey()
  const keyCheck = validateKey(encryptionKey)
  if (!keyCheck.valid) return NextResponse.json({ error: keyCheck.message }, { status: 400 })

  try {
    const encryptedContent = encryptScript(content, encryptionKey)
    const id = storeScript(name, encryptedContent, encryptionKey)
    
    return NextResponse.json({
      success: true,
      id,
      name,
      key: encryptionKey,
      warning: '⚠️ احتفظ بالمفتاح في مكان آمن - لا يمكن استرجاع السكريبت بدونه'
    })
  } catch (err) {
    return NextResponse.json({ error: 'فشل التشفير: ' + err.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  const sessionId = cookies().get('session')?.value
  if (!getSession(sessionId)) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { name } = await request.json()
  deleteScript(name)
  return NextResponse.json({ success: true, message: 'تم الحذف' })
}
