const GOLD = '#D4AF37';
const BLACK = '#000000';
const PANEL = '#111111';
const TEXT = '#F8F5EA';
const MUTED = '#B9B29E';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatAppointmentDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatAppointmentTime(value) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value));
}

function baseEmail({ preheader, title, intro, children, cta }) {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="dark">
    <title>${safeTitle}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; }
        .content { padding: 28px 20px !important; }
        .title { font-size: 28px !important; line-height: 34px !important; }
        .detail-label, .detail-value { display: block !important; width: 100% !important; text-align: left !important; }
        .detail-value { padding-top: 4px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:${BLACK};font-family:Arial,Helvetica,sans-serif;color:${TEXT};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${safePreheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BLACK};padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="width:600px;max-width:600px;background:${PANEL};border:1px solid rgba(212,175,55,0.35);border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:22px 28px;border-bottom:1px solid rgba(212,175,55,0.22);background:#050505;">
                <div style="font-size:12px;letter-spacing:4px;text-transform:uppercase;color:${GOLD};font-weight:700;">Sahil Cutz</div>
                <div style="margin-top:6px;font-size:13px;color:${MUTED};">Premium barbershop appointments</div>
              </td>
            </tr>
            <tr>
              <td class="content" style="padding:38px 34px 34px;">
                <h1 class="title" style="margin:0;color:${TEXT};font-size:34px;line-height:40px;font-weight:800;">${safeTitle}</h1>
                <p style="margin:16px 0 26px;color:${MUTED};font-size:16px;line-height:25px;">${safeIntro}</p>
                ${children}
                ${cta ? `<div style="margin-top:30px;">${cta}</div>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px;background:#050505;border-top:1px solid rgba(212,175,55,0.22);color:${MUTED};font-size:12px;line-height:18px;">
                You are receiving this email because you used Sahil Cutz booking services.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button({ href, label }) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${GOLD};color:${BLACK};text-decoration:none;font-weight:800;border-radius:999px;padding:14px 24px;font-size:15px;">${escapeHtml(label)}</a>`;
}

function detailsTable(rows) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#080808;border:1px solid rgba(212,175,55,0.25);border-radius:14px;overflow:hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td class="detail-label" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);color:${MUTED};font-size:13px;width:38%;">${escapeHtml(label)}</td>
        <td class="detail-value" style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.08);color:${TEXT};font-size:14px;font-weight:700;text-align:right;">${escapeHtml(value)}</td>
      </tr>
    `).join('')}
  </table>`;
}

export function welcomeEmailHtml({ fullName, bookingUrl }) {
  const displayName = fullName ? ` ${fullName}` : '';

  return baseEmail({
    preheader: 'Your Sahil Cutz account is active.',
    title: 'Welcome to Sahil Cutz',
    intro: `Welcome${displayName}. Your account is active and ready for premium appointment booking.`,
    children: `<p style="margin:0;color:${MUTED};font-size:15px;line-height:24px;">Book your first cut, choose your preferred barber, and manage your appointments from your dashboard whenever you need.</p>`,
    cta: button({ href: bookingUrl, label: 'Book your first appointment' }),
  });
}

export function bookingConfirmationHtml(details) {
  return baseEmail({
    preheader: `Your ${details.serviceName} appointment is confirmed.`,
    title: 'Booking confirmed',
    intro: 'Your appointment is locked in. Here are the details for your visit.',
    children: detailsTable([
      ['Service', details.serviceName],
      ['Barber', details.barberName],
      ['Date', formatAppointmentDate(details.startAt)],
      ['Time', formatAppointmentTime(details.startAt)],
      ['Amount paid', formatCurrency(details.amountPaid)],
    ]),
  });
}

export function adminBookingNotificationHtml(details) {
  return baseEmail({
    preheader: `New booking from ${details.customerName || details.customerEmail}.`,
    title: 'New booking received',
    intro: 'A customer completed a booking. Review the appointment details below.',
    children: detailsTable([
      ['Customer', details.customerName || details.customerEmail],
      ['Email', details.customerEmail],
      ['Service', details.serviceName],
      ['Barber', details.barberName],
      ['Date', formatAppointmentDate(details.startAt)],
      ['Time', formatAppointmentTime(details.startAt)],
      ['Amount paid', formatCurrency(details.amountPaid)],
    ]),
  });
}

export function reminderEmailHtml(details) {
  return baseEmail({
    preheader: `Reminder: your ${details.serviceName} appointment is coming up.`,
    title: 'Appointment reminder',
    intro: 'Your Sahil Cutzz appointment is coming up in the next 24 hours.',
    children: detailsTable([
      ['Service', details.serviceName],
      ['Barber', details.barberName],
      ['Date', formatAppointmentDate(details.startAt)],
      ['Time', formatAppointmentTime(details.startAt)],
    ]),
  });
}
