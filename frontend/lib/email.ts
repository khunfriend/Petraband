import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM || "PETRAband <onboarding@resend.dev>";
const APP_URL = process.env.AUTH_URL || "http://localhost:3000";

export async function sendAdminNewPendingEmail(
  to: string,
  adminNickname: string,
  applicantNickname: string,
  applicantEmail: string
) {
  const url = `${APP_URL}/admin/pending-users`;
  if (!resend) {
    console.log(`[email] Admin ${to}: new pending user ${applicantNickname} <${applicantEmail}> → ${url}`);
    return;
  }
  await resend.emails.send({
    from: FROM,
    to,
    subject: `[PETRAband] มีสมาชิกใหม่รอการอนุมัติ: ${applicantNickname}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color:#1a1a1a;">มีสมาชิกใหม่รอการอนุมัติ</h2>
        <p>สวัสดี ${adminNickname},</p>
        <p><strong>${applicantNickname}</strong> (${applicantEmail}) ยืนยันอีเมลเรียบร้อยแล้ว และรอการอนุมัติจาก admin</p>
        <p style="margin:24px 0;">
          <a href="${url}" style="background:#FF6B6B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
            เปิดหน้าอนุมัติ
          </a>
        </p>
        <p style="color:#999;font-size:12px;">${url}</p>
      </div>
    `,
  });
}

export async function sendApprovalResultEmail(
  to: string,
  nickname: string,
  approved: boolean,
  reason?: string | null
) {
  const loginUrl = `${APP_URL}/login`;
  if (!resend) {
    console.log(`[email] Approval result for ${to}: ${approved ? "APPROVED" : `REJECTED (${reason ?? ""})`}`);
    return;
  }
  const subject = approved
    ? "[PETRAband] บัญชีของคุณได้รับการอนุมัติแล้ว"
    : "[PETRAband] บัญชีของคุณไม่ได้รับการอนุมัติ";
  const body = approved
    ? `
      <p>สวัสดี ${nickname},</p>
      <p>บัญชี PETRAband ของคุณได้รับการอนุมัติจาก admin แล้ว สามารถเข้าสู่ระบบได้ทันที</p>
      <p style="margin:24px 0;">
        <a href="${loginUrl}" style="background:#FF6B6B;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          เข้าสู่ระบบ
        </a>
      </p>
    `
    : `
      <p>สวัสดี ${nickname},</p>
      <p>ขออภัย บัญชี PETRAband ของคุณไม่ได้รับการอนุมัติจาก admin</p>
      ${reason ? `<p><strong>เหตุผล:</strong> ${reason}</p>` : ""}
      <p>หากต้องการสอบถาม กรุณาติดต่อผู้ดูแลระบบของวง</p>
    `;
  await resend.emails.send({
    from: FROM,
    to,
    subject,
    html: `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">${body}</div>`,
  });
}

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
