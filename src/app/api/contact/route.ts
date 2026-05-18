import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { success: false, message: "All fields are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email address." },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "support@system-design-academy.online";

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return NextResponse.json(
        { success: false, message: "Email service not configured." },
        { status: 500 }
      );
    }

    const resend = new Resend(resendApiKey);
    const toEmail = process.env.CONTACT_EMAIL || "support@system-design-academy.online";

    const { error: adminEmailError } = await resend.emails.send({
      from: `System Design Academy <${fromEmail}>`,
      to: toEmail,
      subject: `Contact Us: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
          <h2 style="color: #1b376d;">New Contact Form Submission</h2>
          <div style="background: #f8f9fc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 8px 0;"><strong>Name:</strong> ${name}</p>
            <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 8px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 8px 0;"><strong>Message:</strong></p>
            <p style="margin: 8px 0; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 24px; color: #64748b; font-size: 12px;">This message was sent from the System Design Academy contact form.</p>
        </div>
      `,
    });

    if (adminEmailError) {
      console.error("Failed to send admin notification email:", adminEmailError);
    }

    const { error: autoReplyError } = await resend.emails.send({
      from: `System Design Academy <${fromEmail}>`,
      to: email,
      subject: `We received your message — ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 32px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Thanks for reaching out, ${name}!</h1>
          </div>
          <div style="padding: 0 8px;">
            <p style="font-size: 16px; line-height: 1.6; color: #374151;">We've received your message and will get back to you as soon as possible.</p>
            <div style="background: #f8f9fc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 0 0 8px 0;"><strong style="color: #64748b;">Subject:</strong></p>
              <p style="margin: 0 0 16px 0; font-weight: 600;">${subject}</p>
              <p style="margin: 0 0 8px 0;"><strong style="color: #64748b;">Your Message:</strong></p>
              <p style="margin: 0; white-space: pre-wrap; color: #374151;">${message}</p>
            </div>
            <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">Our team typically responds within 24-48 hours. In the meantime, feel free to explore our <a href="https://system-design-academy.online" style="color: #667eea;">curriculum</a> and start learning for free.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">This is an automated response. Please do not reply directly to this email.</p>
          </div>
        </div>
      `,
    });

    if (autoReplyError) {
      console.error("Failed to send auto-reply email:", autoReplyError);
    }

    return NextResponse.json({
      success: true,
      message: "Message sent successfully. We'll get back to you soon.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Contact form error:", message);
    return NextResponse.json(
      { success: false, message: "Failed to send message. Please try again." },
      { status: 500 }
    );
  }
}