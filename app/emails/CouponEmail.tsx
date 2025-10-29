// app/emails/CouponEmail.tsx
export function CouponEmail({
  code,
  school,
}: { code: string; school: string }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
      <h2>Welcome to GoodLoop 🎉</h2>
      <p>Thanks for joining the pilot{school ? ` at ${school}` : ''}!</p>
      <p>Your one-time discount code:</p>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 22,
          fontWeight: 700,
          padding: '12px 16px',
          border: '2px dashed #222',
          display: 'inline-block',
          letterSpacing: 2,
        }}
      >
        {code}
      </div>
      <p style={{ marginTop: 16 }}>
        Show this at <b>Cluck N Sip</b> to redeem. The cashier will verify and mark it used.
      </p>
      <hr />
      <p style={{ fontSize: 12, color: '#666' }}>
        Code is single-use and tied to your email. Please do not share publicly.
      </p>
    </div>
  );
}
