import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

function generateCertificateNumber(userId: string, date: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId + date);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i];
    hash = (hash << 5) - hash + byte;
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  const suffix = positiveHash.toString().padStart(5, "0").slice(0, 5);
  return `SDA-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Fetch profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: "User profile not found." },
        { status: 404 }
      );
    }

    const fullName = profile.full_name || "Student";
    const email = profile.email || user.email || "";
    const courseName = "System Design Academy";
    const completionDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const certificateNumber = generateCertificateNumber(
      userId,
      new Date().toISOString()
    );

    // Generate PDF
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Decorative border
    doc.setDrawColor(25, 55, 109);
    doc.setLineWidth(4);
    doc.rect(30, 30, pageWidth - 60, pageHeight - 60);

    doc.setDrawColor(200, 170, 100);
    doc.setLineWidth(2);
    doc.rect(38, 38, pageWidth - 76, pageHeight - 76);

    // Background accent
    doc.setFillColor(248, 249, 252);
    doc.rect(38, 38, pageWidth - 76, pageHeight - 76, "F");

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.setTextColor(25, 55, 109);
    doc.text("CERTIFICATE", pageWidth / 2, 110, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(100, 100, 100);
    doc.text("OF COMPLETION", pageWidth / 2, 140, { align: "center" });

    // Decorative line
    doc.setDrawColor(200, 170, 100);
    doc.setLineWidth(1.5);
    doc.line(pageWidth / 2 - 100, 155, pageWidth / 2 + 100, 155);

    // Recipient
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text("This certifies that", pageWidth / 2, 190, { align: "center" });

    doc.setFontSize(28);
    doc.setTextColor(25, 55, 109);
    doc.text(fullName, pageWidth / 2, 230, { align: "center" });

    // Course
    doc.setFontSize(14);
    doc.setTextColor(80, 80, 80);
    doc.text("has successfully completed the course", pageWidth / 2, 270, {
      align: "center",
    });

    doc.setFont("helvetica", "bolditalic");
    doc.setFontSize(22);
    doc.setTextColor(25, 55, 109);
    doc.text(courseName, pageWidth / 2, 305, { align: "center" });

    // Details
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Completion Date: ${completionDate}`, pageWidth / 2, 350, {
      align: "center",
    });
    doc.text(`Certificate Number: ${certificateNumber}`, pageWidth / 2, 370, {
      align: "center",
    });

    // Signature line
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 80, 420, pageWidth / 2 + 80, 420);
    doc.setFontSize(12);
    doc.text("System Design Academy", pageWidth / 2, 440, { align: "center" });

    // Logo placeholder text
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("[LOGO PLACEHOLDER]", 80, pageHeight - 80, { align: "center" });

    const pdfBuffer = doc.output("arraybuffer");
    const pdfBase64 = Buffer.from(pdfBuffer).toString("base64");

    // Save certificate record
    const { error: certError } = await supabase.from("certificates").insert({
      user_id: userId,
      certificate_number: certificateNumber,
      course_name: courseName,
      issued_at: new Date().toISOString(),
      pdf_data: pdfBase64,
    });

    if (certError) {
      console.error("Failed to save certificate record:", certError);
    }

    // Upload PDF to storage for download URL
    const fileName = `certificates/${userId}/${certificateNumber}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("certificates")
      .upload(fileName, Buffer.from(pdfBuffer), {
        contentType: "application/pdf",
        upsert: true,
      });

    let downloadUrl: string | undefined;
    if (!uploadError) {
      const { data: signedUrlData } = await supabase.storage
        .from("certificates")
        .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days
      downloadUrl = signedUrlData?.signedUrl;
    }

    // Email via Resend
    let emailed = false;
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && email) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: `System Design Academy <${process.env.CERTIFICATE_FROM_EMAIL || "onboarding@resend.dev"}>`,

          to: email,
          subject: "Your System Design Academy Certificate",
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
            <h1 style="color: #1b376d;">Congratulations, ${fullName}!</h1>
            <p>You have successfully completed the <strong>System Design Academy</strong> course.</p>
            <div style="background: #f8f9fc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 4px 0;"><strong>Certificate Number:</strong> ${certificateNumber}</p>
              <p style="margin: 4px 0;"><strong>Completion Date:</strong> ${completionDate}</p>
              <p style="margin: 4px 0;"><strong>Course:</strong> ${courseName}</p>
            </div>
            <p>Your certificate is attached to this email. You can also download it anytime from your dashboard.</p>
            <p style="margin-top: 24px; color: #64748b; font-size: 12px;">System Design Academy Team</p>
          </div>`,
          attachments: [
            {
              filename: `SDA-Certificate-${certificateNumber}.pdf`,
              content: pdfBase64,
            },
          ],
        });
        emailed = true;
      } catch (emailErr) {
        console.error(
          "Failed to send certificate email:",
          emailErr instanceof Error ? emailErr.message : emailErr
        );
      }
    }

    return NextResponse.json({
      success: true,
      downloadUrl,
      emailed,
      message: emailed
        ? "Certificate generated and emailed successfully."
        : "Certificate generated successfully.",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Internal server error";
    console.error("Certificate generation error:", message);
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
