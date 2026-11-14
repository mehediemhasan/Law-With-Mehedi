// Cloudflare Pages Function: POST /api/contact
// Required environment variables (Cloudflare Pages > Settings > Variables and Secrets):
//   RESEND_API_KEY (secret), MAIL_TO (your inbox), MAIL_FROM (e.g. "Law with Mehedi <onboarding@resend.dev>")
export async function onRequestPost({ request, env }) {
  const j = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });
  let d;
  try { d = await request.json(); } catch { return j({ error: 'bad request' }, 400); }
  if (d.website) return j({ ok: true }); // honeypot: bots fill this hidden field
  const c = s => String(s || '').trim();
  const name = c(d.name).slice(0, 80), contact = c(d.contact).slice(0, 120),
        topic = c(d.topic).slice(0, 60), message = c(d.message).slice(0, 2000);
  if (!name || !contact || message.length < 10) return j({ error: 'invalid' }, 400);
  if (!env.RESEND_API_KEY || !env.MAIL_TO || !env.MAIL_FROM) return j({ error: 'not configured' }, 500);
  const esc = s => s.replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM, to: [env.MAIL_TO],
      subject: 'New website message: ' + esc(topic) + ' from ' + esc(name),
      html: `<p><b>Name:</b> ${esc(name)}</p><p><b>Contact:</b> ${esc(contact)}</p><p><b>Topic:</b> ${esc(topic)}</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`
    })
  });
  if (!r.ok) {
  const errorDetails = await r.text();
  console.error("Resend Error:", r.status, errorDetails);
  return j({ error: "mail failed", status: r.status }, 502);
}

return j({ ok: true });
}
