import nodemailer from "nodemailer";

export interface AccessEmailParams {
  to: string;
  name: string;
  employeeId: string;
  setupUrl: string;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

function getTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

export async function sendAccessEmail({ to, name, employeeId, setupUrl }: AccessEmailParams): Promise<SendResult> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[mailer] EMAIL_USER/EMAIL_PASS not configured — skipped access email to ${to}.`);
    return { sent: false, reason: "Email credentials not configured" };
  }

  const firstName = name.split(" ")[0];
  const from = process.env.EMAIL_USER;

  try {
    await transporter.sendMail({
      from: `"Custech HR" <${from}>`,
      to,
      subject: "Set your password to activate your Custech HR Portal access",
      html: `
        <div style="font-family: -apple-system, Segoe UI, Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#0f172a;">
          <div style="width:40px;height:40px;border-radius:10px;background:#4338ca;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;">CT</div>
          <h2 style="margin-top:20px;">Welcome to Custech, ${firstName}!</h2>
          <p style="color:#475569;line-height:1.6;">
            Your employee record has been added to the Custech HR Portal. Before you can sign in, set a password
            for your account below.
          </p>
          <table style="width:100%;background:#f6f7fb;border-radius:12px;padding:16px;margin:20px 0;border-collapse:collapse;">
            <tr><td style="padding:6px 0;color:#64748b;">Employee ID</td><td style="padding:6px 0;font-weight:600;">${employeeId}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Login Email</td><td style="padding:6px 0;font-weight:600;">${to}</td></tr>
          </table>
          <a href="${setupUrl}" style="display:inline-block;background:#4338ca;color:#fff;text-decoration:none;padding:10px 20px;border-radius:10px;font-weight:600;">
            Set My Password
          </a>
          <p style="color:#94a3b8;font-size:12px;margin-top:24px;">
            This link can only be used once. Once your password is set, sign in with your registered email and
            the password you choose. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });
    return { sent: true };
  } catch (error) {
    console.error("[mailer] Failed to send access email:", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Unknown error" };
  }
}
