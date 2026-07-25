import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 465);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    throw new Error('Email is not configured. Missing EMAIL_HOST, EMAIL_USER, or EMAIL_PASS.');
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    tls: {
      servername: host,
    },
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

export async function sendMail({ to, subject, html }) {
  try {
    if (!to || !subject || !html) {
      throw new Error('sendMail requires to, subject, and html.');
    }

    const mailer = getTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'admin@sahilcutzz.com';

    await mailer.sendMail({
      from: `"Sahil Cutz" <${from}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error instanceof Error ? error.message : error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error',
    };
  }
}
