// app/api/leads/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { adminSupabase } from '../../../lib/supabase'
import { CouponEmail } from '../../emails/CouponEmail'

const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.FROM_EMAIL || 'GoodLoop <onboarding@resend.dev>'
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null

function genCode(prefix: string) {
  const n = Math.random().toString(36).slice(2, 6).toUpperCase()
  const t = Date.now().toString(36).slice(-4).toUpperCase()
  return `${prefix}-${n}${t}`
}

export async function POST(req: Request) {
  try {
    const { email, school, role, answers, honeypot } = await req.json()
    if (honeypot) return NextResponse.json({ ok: true })
    if (!email || !school) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
    }

    const db = adminSupabase()

    // leads 记录（重复不阻塞）
    await db
      .from('leads')
      .insert({ email, school, role: role || 'buyer', answers: answers || {} })
      .then(({ error }) => {
        if (error) console.warn('leads insert warn:', error.message)
      })

    // 1) 找商家
    const { data: partner, error: pErr } = await db
      .from('partners')
      .select('*')
      .eq('slug', 'clucknsip')
      .maybeSingle()
    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!partner) return NextResponse.json({ error: 'partner_not_found' }, { status: 404 })

    // 2) 找活动（先找在期中的，没有就取最新一条）
    const nowIso = new Date().toISOString()
    let { data: offer } = await db
      .from('offers')
      .select('*')
      .eq('partner_id', partner.id)
      .eq('active', true)
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .order('created_at', { ascending: false })
      .maybeSingle()
    if (!offer) {
      const { data: fallback } = await db
        .from('offers')
        .select('*')
        .eq('partner_id', partner.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      offer = fallback || null
    }
    if (!offer) return NextResponse.json({ error: 'no_offer_configured' }, { status: 404 })

    // 学校白名单 / 发放上限（若配置）
    if (offer.school_whitelist && !offer.school_whitelist.includes(school)) {
      return NextResponse.json({ error: 'school_not_allowed' }, { status: 403 })
    }
    if (offer.total_limit && (offer.total_issued ?? 0) >= offer.total_limit) {
      return NextResponse.json({ error: 'offer_sold_out' }, { status: 410 })
    }

    // 3) 复用“同一 offer”的未使用券
    const { data: existing, error: exErr } = await db
      .from('coupons')
      .select('*')
      .eq('email', email)
      .eq('offer_id', offer.id)
      .is('used_at', null)
      .maybeSingle()
    if (exErr) return NextResponse.json({ error: exErr.message }, { status: 500 })

    const code = existing?.code || genCode(String(partner.slug).slice(0, 4).toUpperCase())

    if (!existing) {
      const { error: insErr } = await db.from('coupons').insert({
        offer_id: offer.id,
        partner_id: partner.id,
        code,
        email,
        school,
      })
      if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
      // 计数 +1（非强制）
      await db.from('offers').update({ total_issued: (offer.total_issued ?? 0) + 1 }).eq('id', offer.id)
    }

    // 4) 发邮件（未配置 RESEND 时跳过）
    const canSend = Boolean(resend && FROM)
    console.log('EMAIL_DEBUG canSend=', canSend, 'hasKey=', !!RESEND_KEY, 'from=', FROM)

    if (canSend) {
      try {
        const resp = await resend!.emails.send({
          from: FROM!,
          to: email,
          subject: 'Your GoodLoop discount code 🎉',
          react: CouponEmail({ code, school }),
        })
        console.log('EMAIL_DEBUG sent ok:', (resp as any)?.id || resp)
      } catch (err) {
        console.error('EMAIL_DEBUG send error:', err)
      }
    } else {
      console.warn('EMAIL_DEBUG skipped sending email')
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error(e)
    return NextResponse.json({ error: 'server_error', detail: e?.message }, { status: 500 })
  }
}

  