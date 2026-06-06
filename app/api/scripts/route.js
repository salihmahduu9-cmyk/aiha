import { getSession } from '../../../lib/auth.js'
import { listScripts } from '../../../lib/store.js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  const sessionId = cookies().get('session')?.value
  if (!getSession(sessionId)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  
  const scripts = listScripts()
  return NextResponse.json({ scripts })
}
