import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

interface PasswordResetPayload {
  name: string;
  email: string;
  code: string;
  returnCodeOnFailure?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: PasswordResetPayload = await request.json();
    const { name, email, code } = body;

    if (!name || !email || !code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, reason: "resend_not_configured", code }, { status: 200 });
    }

    const domain = process.env.RESEND_DOMAIN;
    const fromEmail = domain
      ? `MACAO <no-reply@${domain}>`
      : "MACAO Adventure Park <onboarding@resend.dev>";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <div style="background:#0a0a0a;padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MACAO</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Adventure Park</p>
          </div>
          <div style="padding:32px 24px;">
            <h2 style="margin:0 0 12px;font-size:22px;color:#0a0a0a;">Restablecer contraseña</h2>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#3f3f46;">
              Hola <strong>${name}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta en Macao Adventure Park.
            </p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">
              Ingresa el siguiente código de 6 dígitos en la app. Expira en <strong>15 minutos</strong>.
            </p>
            <div style="margin:16px 0;padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:1.2px;">Código de verificación</p>
              <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:8px;color:#0a0a0a;">${code}</p>
            </div>
            <p style="margin:16px 0 0;font-size:13px;color:#71717a;">
              Si no solicitaste este cambio, puedes ignorar este mensaje. Tu contraseña no será modificada.
            </p>
          </div>
          <div style="padding:20px 24px;background:#f8f9fa;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#a1a1aa;">© 2026 Macao Adventure Park. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resend = getResend();
    const { error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "Código para restablecer tu contraseña — Macao Adventure Park",
      html,
    });

    if (error) {
      console.error("[send-password-reset] Resend error:", error);
      return NextResponse.json({ success: false, error: "email_failed", code }, { status: 200 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-password-reset] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
