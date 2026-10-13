const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!SERVICE_KEY || process.env.NODE_ENV === 'test') return
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opts),
    })
  } catch {
    // Non-fatal: email delivery failure should not break API responses
  }
}

/* ---- Template helpers ---- */

const BASE = `
<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111;max-width:520px;margin:40px auto;padding:0 16px">
<img src="https://taim.in/logo.png" alt="Taim" style="height:32px;margin-bottom:24px">
`
const FOOT = `
<hr style="border:none;border-top:1px solid #eee;margin:32px 0">
<p style="font-size:12px;color:#888">Taim · India's task marketplace · <a href="https://taim.in/profile/privacy">Manage notifications</a></p>
</body></html>`

export function emailNewOffer(opts: { posterName: string; taskTitle: string; taskerName: string; amountRs: number; taskUrl: string }) {
  return {
    subject: `New offer on "${opts.taskTitle}"`,
    html: `${BASE}<h2 style="margin:0 0 8px">You have a new offer 🎉</h2>
<p><strong>${opts.taskerName}</strong> has sent an offer of <strong>₹${opts.amountRs.toLocaleString('en-IN')}</strong> on your task <em>${opts.taskTitle}</em>.</p>
<a href="${opts.taskUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">View offer</a>${FOOT}`,
  }
}

export function emailOfferAccepted(opts: { taskerName: string; taskTitle: string; amountRs: number; taskUrl: string }) {
  return {
    subject: `Your offer was accepted — ${opts.taskTitle}`,
    html: `${BASE}<h2 style="margin:0 0 8px">Offer accepted! 🤝</h2>
<p>Your offer of <strong>₹${opts.amountRs.toLocaleString('en-IN')}</strong> for <em>${opts.taskTitle}</em> was accepted. The poster will now make payment to proceed.</p>
<a href="${opts.taskUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">View task</a>${FOOT}`,
  }
}

export function emailEscrowHeld(opts: { taskerName: string; taskTitle: string; amountRs: number; bookingUrl: string }) {
  return {
    subject: `Payment secured — ${opts.taskTitle}`,
    html: `${BASE}<h2 style="margin:0 0 8px">Payment is in escrow 💰</h2>
<p>₹${opts.amountRs.toLocaleString('en-IN')} has been held in escrow for <em>${opts.taskTitle}</em>. You can now start the work!</p>
<a href="${opts.bookingUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">View booking</a>${FOOT}`,
  }
}

export function emailTaskerDone(opts: { posterName: string; taskTitle: string; bookingUrl: string }) {
  return {
    subject: `Tasker marked task done — ${opts.taskTitle}`,
    html: `${BASE}<h2 style="margin:0 0 8px">Task marked complete ✅</h2>
<p>Your tasker has marked <em>${opts.taskTitle}</em> as done. Please review and enter the OTP to release payment.</p>
<a href="${opts.bookingUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">Release payment</a>${FOOT}`,
  }
}

export function emailDisputeOpened(opts: { taskTitle: string; adminUrl: string }) {
  return {
    subject: `Dispute opened — ${opts.taskTitle}`,
    html: `${BASE}<h2 style="margin:0 0 8px">A dispute has been opened</h2>
<p>A dispute was raised for task <em>${opts.taskTitle}</em>. Our team will review and resolve it within 3 business days.</p>
<a href="${opts.adminUrl}" style="display:inline-block;background:#f59e0b;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:700;margin-top:16px">View dispute</a>${FOOT}`,
  }
}
