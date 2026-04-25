import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

interface ReminderPayload {
  type: "day_before" | "one_hour";
  customer: { name: string; email: string };
  pickup: {
    hotel?: string;
    custom?: string;
    date?: string;
    time?: string;
    point?: string;
  };
  items: { name: string; quantity: number }[];
  reservationId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ReminderPayload = await request.json();
    const { type, customer, pickup, items, reservationId } = body;

    if (!customer?.email || !customer?.name) {
      return NextResponse.json({ error: "Missing customer data" }, { status: 400 });
    }

    const locationLabel = pickup?.hotel || pickup?.custom || "tu punto de recogida";

    const isOneHour = type === "one_hour";

    const subjectLine = isOneHour
      ? `⏰ ¡Tu recogida es en 1 hora! — ${customer.name}`
      : `🌅 Mañana es tu experiencia en Macao — ${customer.name}`;

    const headingEmoji = isOneHour ? "⏰" : "🌅";
    const headingText = isOneHour
      ? "¡Tu recogida es en menos de una hora!"
      : "Mañana es tu experiencia";
    const bodyText = isOneHour
      ? `Hola ${customer.name}, te recordamos que tu chofer pasará por ti muy pronto. Asegúrate de estar listo en el punto de recogida.`
      : `Hola ${customer.name}, mañana es el gran día. Aquí tienes un resumen de tu recogida para que no olvides nada.`;

    const itemsHtml = items
      .map(
        (item) =>
          `<li style="margin:4px 0;font-size:14px;color:#555;">${item.quantity}× ${item.name}</li>`,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <div style="background:#0a0a0a;padding:28px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">MACAO</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.5);font-size:11px;text-transform:uppercase;letter-spacing:2px;">Adventure Park</p>
          </div>

          <div style="padding:32px 24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;background:#fef9c3;border-radius:50%;line-height:56px;font-size:26px;">${headingEmoji}</div>
              <h2 style="margin:12px 0 4px;font-size:20px;color:#0a0a0a;">${headingText}</h2>
              <p style="margin:0;font-size:14px;color:#71717a;">${bodyText}</p>
            </div>

            <div style="background:#f8f9fa;border-radius:12px;padding:16px;margin:20px 0;">
              <p style="margin:0 0 10px;font-weight:600;font-size:13px;color:#333;">Detalles de recogida</p>
              <table style="width:100%;font-size:13px;color:#555;border-collapse:collapse;">
                <tr><td style="padding:4px 0;font-weight:500;">Ubicación:</td><td style="padding:4px 0;">${locationLabel}</td></tr>
                ${pickup.date ? `<tr><td style="padding:4px 0;font-weight:500;">Fecha:</td><td style="padding:4px 0;">${pickup.date}</td></tr>` : ""}
                ${pickup.time ? `<tr><td style="padding:4px 0;font-weight:500;">Horario:</td><td style="padding:4px 0;">${pickup.time}</td></tr>` : ""}
                ${pickup.point ? `<tr><td style="padding:4px 0;font-weight:500;">Punto:</td><td style="padding:4px 0;">${pickup.point}</td></tr>` : ""}
              </table>
            </div>

            <div style="margin:16px 0;">
              <p style="font-size:12px;font-weight:600;text-transform:uppercase;color:#71717a;margin:0 0 8px;">Tu experiencia</p>
              <ul style="margin:0;padding:0 0 0 16px;">
                ${itemsHtml}
              </ul>
            </div>

            <div style="margin-top:24px;border-top:1px solid #eee;padding-top:16px;text-align:center;">
              <p style="font-size:12px;color:#a1a1aa;margin:0;">Reserva: <strong>${reservationId}</strong></p>
              <p style="font-size:12px;color:#a1a1aa;margin:4px 0 0;">¿Alguna duda? Escríbenos por WhatsApp al <strong>+1 849-473-1020</strong></p>
            </div>
          </div>

          <div style="background:#fafafa;padding:16px 24px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} Macao Adventure Park · Punta Cana, República Dominicana</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resend = getResend();
    const { error } = await resend.emails.send({
      from: "Macao Adventure Park <reservas@macao.com.do>",
      to: customer.email,
      subject: subjectLine,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("send-pickup-reminder error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
