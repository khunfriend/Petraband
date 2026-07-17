import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "PETRAband <onboarding@resend.dev>";
const APP_URL = process.env.AUTH_URL || "http://localhost:3000";

export async function sendPasswordResetEmail(to: string, nickname: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  if (!resend) {
    // Dev fallback — log link to console instead of sending
    console.log(`[email] Password reset link for ${to}: ${url}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "รีเซ็ตรหัสผ่าน PETRAband",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">รีเซ็ตรหัสผ่าน</h2>
        <p>สวัสดี ${nickname},</p>
        <p>เราได้รับคำขอรีเซ็ตรหัสผ่านของบัญชี PETRAband คลิกลิงก์ด้านล่างเพื่อตั้งรหัสผ่านใหม่:</p>
        <p style="margin: 24px 0;">
          <a href="${url}" style="background: #FF6B6B; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">
            รีเซ็ตรหัสผ่าน
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          ลิงก์นี้จะหมดอายุใน 30 นาที หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน สามารถละเว้นอีเมลนี้ได้เลย
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          หรือ copy ลิงก์นี้: ${url}
        </p>
      </div>
    `,
  });
}
