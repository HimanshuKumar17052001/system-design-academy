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
    const toEmail = process.env.CONTACT_EMAIL || "support@system-design-academy.online";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: `System Design Academy <${process.env.FROM_EMAIL || "support@system-design-academy.online"}>`,
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