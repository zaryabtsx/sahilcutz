import { NextRequest, NextResponse } from 'next/server';
import { sendMail } from '@/lib/mailer';
import { welcomeEmailHtml } from '@/lib/emailTemplates';

function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!isValidEmail(body.email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      request.nextUrl.origin;

    const result = await sendMail({
      to: body.email,
      subject: 'Welcome to Sahil Cutz 🎉',
      html: welcomeEmailHtml({
        fullName: typeof body.fullName === 'string' ? body.fullName : '',
        bookingUrl: `${siteUrl}/booking`,
      }),
    });

    return NextResponse.json({ success: result.success });
  } catch (error) {
    console.error('Welcome email route failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false });
  }
}
