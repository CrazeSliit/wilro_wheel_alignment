import nodemailer from "nodemailer";

type SendWelcomeArgs = {
  to: string;
  name: string;
  loginEmail: string;
  tempPassword: string;
};

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

function getAppName(): string {
  return process.env.APP_NAME || "Iruka Motors";
}

function createTransporter() {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || "587");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS?.replace(/\s+/g, "");

  if (!host || !user || !pass) {
    throw new Error("Email configuration is incomplete. Check EMAIL_HOST, EMAIL_USER and EMAIL_PASS.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function buildWelcomeEmailHtml(name: string, loginEmail: string, tempPassword: string): string {
  const appName = getAppName();
  const appUrl = getAppUrl();

  return `
    <div style="background:#f4f4f4;padding:24px 12px;font-family:Arial,sans-serif;color:#111827;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
        <div style="background:#2563eb;padding:20px 24px;color:#fff;">
          <h1 style="margin:0;font-size:22px;">${appName}</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:.9;">Employee Account Created</p>
        </div>
        <div style="padding:24px;line-height:1.6;">
          <p style="margin:0 0 12px;">Dear ${name},</p>
          <p style="margin:0 0 16px;">Your account has been created successfully. Use the credentials below to sign in.</p>

          <div style="background:#f0f9ff;border-left:4px solid #2563eb;border-radius:8px;padding:16px;margin:0 0 16px;">
            <p style="margin:0 0 6px;"><strong>Login Email:</strong> ${loginEmail}</p>
            <p style="margin:0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>

          <p style="margin:0 0 18px;">For security, you will be asked to change your password after first login.</p>

          <a href="${appUrl}/login" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">Login to your account</a>
        </div>
        <div style="padding:14px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          ${appName} · If you did not expect this email, contact your administrator.
        </div>
      </div>
    </div>
  `;
}

function buildWelcomeEmailText(name: string, loginEmail: string, tempPassword: string): string {
  return [
    `Dear ${name},`,
    "",
    "Your account has been created successfully.",
    `Login Email: ${loginEmail}`,
    `Temporary Password: ${tempPassword}`,
    "",
    "You will be required to change your password after your first login.",
    `Login: ${getAppUrl()}/login`,
  ].join("\n");
}

export async function sendWelcomeEmail(args: SendWelcomeArgs): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const transporter = createTransporter();
    const from = process.env.EMAIL_FROM || process.env.EMAIL_USER;

    if (!from) {
      return { success: false, error: "EMAIL_FROM or EMAIL_USER must be set." };
    }

    await transporter.sendMail({
      from,
      to: args.to,
      subject: `Welcome to ${getAppName()} - Your Login Credentials`,
      html: buildWelcomeEmailHtml(args.name, args.loginEmail, args.tempPassword),
      text: buildWelcomeEmailText(args.name, args.loginEmail, args.tempPassword),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}
