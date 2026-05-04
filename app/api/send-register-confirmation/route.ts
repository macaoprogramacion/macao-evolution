import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

interface RegisterConfirmationPayload {
  name: string;
  email: string;
  role: "cliente" | "representante";
  code?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterConfirmationPayload = await request.json();
    const { name, email, role, code } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // If email provider is not configured yet, do not fail user registration.
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, reason: "resend_not_configured", code }, { status: 200 });
    }

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
            <h2 style="margin:0 0 12px;font-size:22px;color:#0a0a0a;">Bienvenido, ${name}</h2>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">
              Tu cuenta fue creada correctamente en Macao Adventure Park.
            </p>
            <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#3f3f46;">
              Tipo de cuenta: <strong>${role}</strong><br/>
              Correo registrado: <strong>${email}</strong>
            </p>
            ${code
              ? `<div style="margin:16px 0;padding:14px;border:1px solid #e5e7eb;border-radius:12px;background:#fafafa;text-align:center;">
                  <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#71717a;text-transform:uppercase;letter-spacing:1.2px;">Código de verificación</p>
                  <p style="margin:0;font-size:30px;line-height:1.1;color:#0a0a0a;font-weight:800;letter-spacing:6px;">${code}</p>
                </div>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46;">
                  Ingresa este código en la app para confirmar tu correo y activar tu cuenta.
                </p>`
              : `<p style="margin:0;font-size:14px;line-height:1.6;color:#3f3f46;">
                  Ya puedes iniciar sesión y gestionar tus reservas.
                </p>`}
          </div>

          <div style="padding:20px 24px;background:#f8f9fa;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#71717a;">© ${new Date().getFullYear()} Macao Adventure Park</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resendDomain = process.env.RESEND_DOMAIN;
    const fromAddress = resendDomain
      ? `Macao Adventure Park <reservas@${resendDomain}>`
      : "Macao Adventure Park <onboarding@resend.dev>";

    const { data, error } = await getResend().emails.send({
      from: fromAddress,
      to: email,
      subject: code
        ? "Código de verificación - Macao Adventure Park"
        : "Tu cuenta fue creada - Macao Adventure Park",
      html,
    });

    if (error) {
      console.error("Register confirmation email error:", error);
      return NextResponse.json({ success: false, error: "email_failed", code }, { status: 200 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Register confirmation route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
