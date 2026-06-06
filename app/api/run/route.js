import { getSession } from '@/lib/auth'
import { decryptScript } from '@/lib/crypto'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const sessionId = cookies().get('session')?.value
  if (!getSession(sessionId)) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { script: scriptId, key } = await request.json()
  if (!scriptId || !key) return NextResponse.json({ error: 'معرف السكريبت والمفتاح مطلوبان' }, { status: 400 })

  const { getScript } = await import('@/lib/store')
  const script = getScript(scriptId)
  if (!script) return NextResponse.json({ error: 'السكريبت غير موجود' }, { status: 404 })

  try {
    const decrypted = decryptScript(script.encryptedContent, key)
    return NextResponse.json({ success: true, output: decrypted })
  } catch (err) {
    return NextResponse.json({ error: 'فشل فك التشفير: مفتاح خاطئ' }, { status: 403 })
  }
}
