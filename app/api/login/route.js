import { initAuth, login } from '@/lib/auth'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request) {
  await initAuth()
  
  const { username, password } = await request.json()
  const sessionId = await login(username, password)
  
  if (!sessionId) {
    return NextResponse.json({ success: false, error: 'اسم المستخدم أو كلمة المرور خطأ' }, { status: 401 })
  }
  
  const response = NextResponse.json({ success: true })
  response.cookies.set('session', sessionId, { httpOnly: true, secure: true, sameSite: 'strict', maxAge: 86400 })
  
  return response
}
