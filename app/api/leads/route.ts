import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { email, school, role, answers, honeypot } = await req.json()
    if (honeypot) return NextResponse.json({ ok: true }) // 反机器人字段
    if (!email || !school) {
      return NextResponse.json({ error: 'missing' }, { status: 400 })
    }

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim() || null
    const ua = req.headers.get('user-agent') || null

    const admin = adminSupabase()
    const { error } = await admin.from('leads').insert({
      email,
      school,
      role: role || 'buyer',
      answers: answers || {},
      ip,
      ua,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server_error' }, { status: 500 })
  }
}
