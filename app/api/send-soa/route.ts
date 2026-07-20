import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { to, subject, html, gmailUser, gmailPass } = await request.json();

    const user = gmailUser || process.env.GMAIL_USER;
    const pass = gmailPass || process.env.GMAIL_PASS;

    if (!user || !pass) {
      return NextResponse.json(
        { error: "Sender credentials not registered.", needsCredentials: true },
        { status: 400 }
      );
    }

    if (!to || !to.trim()) {
      return NextResponse.json({ error: "Recipient email is required." }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: user.trim(),
        pass: pass.trim(),
      },
    });

    await transporter.sendMail({
      from: `"OCCDO Ordering System" <${user.trim()}>`,
      to: to.trim(),
      subject: subject || "Statement of Account",
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending Gmail:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
