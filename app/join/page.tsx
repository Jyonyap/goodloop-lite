'use client'
import React, { useState } from 'react'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

export default function JoinPage() {
  const [email, setEmail] = useState('')
  const [school, setSchool] = useState('UCSD')
  const [role, setRole] = useState<'buyer'|'seller'|'both'>('buyer')
  const [eats, setEats] = useState('2-3')
  const [about, setAbout] = useState('friend')
  const [interests, setInterests] = useState<string[]>([])
  const [agree, setAgree] = useState(true)
  const [honeypot, setHoneypot] = useState('') // anti-bot hidden field
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function toggleInterest(v: string) {
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (!email || !agree) { setErr('Please enter email and accept the terms.'); return }
    setLoading(true)
    try {
      const answers = { eats, about, interests }
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, school, role, answers, honeypot }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'submit_failed')
      setDone(true)
    } catch (e: any) {
      setErr(e?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="bg-white border rounded-2xl p-6 shadow">
          <h1 className="text-2xl font-bold">Welcome to GoodLoop 🎉</h1>
          <p className="mt-2 text-neutral-600 text-sm">
            Thanks! You're on the early list. We&apos;ll email you with beta access and campus perks.
          </p>
          <a href="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-neutral-900 text-white">Back to Home</a>
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <form onSubmit={submit} className="bg-white border rounded-2xl p-6 shadow space-y-4">
        <h1 className="text-2xl font-bold">Join GoodLoop Early</h1>
        <p className="text-sm text-neutral-600">Trade stuff. Earn local food discounts. Pilot: UCSD / SDSU / SDCCD.</p>

        {/* hidden honeypot */}
        <input tabIndex={-1} autoComplete="off" className="hidden" value={honeypot} onChange={(e)=>setHoneypot(e.target.value)} name="website" />

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="School">
            <select className="w-full p-3 border rounded-xl" value={school} onChange={(e)=>setSchool(e.target.value)}>
              <option>UCSD</option>
              <option>SDSU</option>
              <option>San Diego Miramar College</option>
              <option>City College</option>
              <option>Mesa College</option>
            </select>
          </Field>
          <Field label="Email (.edu preferred)">
            <input type="email" className="w-full p-3 border rounded-xl" placeholder="your.name@ucsd.edu" value={email} onChange={(e)=>setEmail(e.target.value)} />
          </Field>
        </div>

        <Field label="I'm mostly a…">
          <div className="flex gap-2">
            {(['buyer','seller','both'] as const).map(v=> (
              <button type="button" key={v}
                onClick={()=>setRole(v)}
                className={`px-3 py-2 rounded-xl border ${role===v? 'bg-neutral-900 text-white':'bg-neutral-50'}`}>{v}</button>
            ))}
          </div>
        </Field>

        <Field label="What are you interested in?">
          <div className="flex flex-wrap gap-2 text-sm">
            {['Furniture','Textbooks','Electronics','Dorm/Appliances','Scooters/Bikes','Other'].map(v=> (
              <label key={v} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border bg-neutral-50">
                <input type="checkbox" checked={interests.includes(v)} onChange={()=>toggleInterest(v)} /> {v}
              </label>
            ))}
          </div>
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Eat out per week?">
            <select className="w-full p-3 border rounded-xl" value={eats} onChange={(e)=>setEats(e.target.value)}>
              <option>0-1</option>
              <option>2-3</option>
              <option>4-5</option>
              <option>6+</option>
            </select>
          </Field>
          <Field label="How did you hear about us?">
            <select className="w-full p-3 border rounded-xl" value={about} onChange={(e)=>setAbout(e.target.value)}>
              <option value="friend">Friend</option>
              <option value="ig">Instagram</option>
              <option value="tiktok">TikTok</option>
              <option value="flyer">Flyer/QR on campus</option>
              <option value="restaurant">At partner restaurant</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={agree} onChange={(e)=>setAgree(e.target.checked)} />
          I agree to receive early access updates and campus perks.
        </label>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex gap-3 pt-2">
          <button disabled={loading} className="px-5 py-3 rounded-2xl bg-red-600 text-white font-semibold disabled:opacity-60">
            {loading? 'Submitting…' : 'Join Now'}
          </button>
          <a href="/" className="px-5 py-3 rounded-2xl bg-neutral-100">Cancel</a>
        </div>

        <p className="text-xs text-neutral-500">We respect your privacy. Data is used only for GoodLoop pilots and will never be sold.</p>
      </form>
    </main>
  )
}
