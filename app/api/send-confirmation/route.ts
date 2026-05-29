import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const getResend = () => new Resend(process.env.RESEND_API_KEY);

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface ConfirmationPayload {
  customer: { name: string; phone: string; email: string };
  items: CartItem[];
  totalPaid: number;
  totalPrice: number;
  paymentMethod: string;
  paymentOption: string;
  remainingAmount?: number;
  pickup?: {
    hotel?: string;
    custom?: string;
    date?: string;
    time?: string;
    point?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfirmationPayload = await request.json();
    const { customer, items, totalPaid, totalPrice, paymentMethod, paymentOption, remainingAmount, pickup } = body;

    if (!customer?.email || !customer?.name) {
      return NextResponse.json({ error: "Missing customer data" }, { status: 400 });
    }

    const itemsHtml = items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;">${item.name}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center;">${item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;">${item.price === 0 ? "GRATIS" : `$${(item.price * item.quantity).toFixed(2)}`}</td>
          </tr>`
      )
      .join("");

    const pickupHtml = pickup?.hotel || pickup?.custom
      ? `
        <div style="margin-top:20px;padding:16px;background:#f8f9fa;border-radius:12px;">
          <p style="margin:0 0 8px;font-weight:600;font-size:14px;color:#333;">Información de recogida</p>
          <p style="margin:0;font-size:13px;color:#555;">
            <strong>Ubicación:</strong> ${pickup.hotel || pickup.custom}<br/>
            ${pickup.date ? `<strong>Fecha:</strong> ${pickup.date}<br/>` : ""}
            ${pickup.time ? `<strong>Horario:</strong> ${pickup.time}<br/>` : ""}
            ${pickup.point ? `<strong>Punto:</strong> ${pickup.point}` : ""}
          </p>
        </div>`
      : "";

    const remainingHtml = paymentOption === "partial" && remainingAmount
      ? `<div style="margin-top:16px;padding:12px 16px;background:#fff3cd;border-radius:8px;border-left:4px solid #ffc107;">
          <p style="margin:0;font-size:13px;color:#856404;">
            <strong>Pago pendiente:</strong> Debes pagar <strong>$${remainingAmount.toFixed(2)}</strong> al llegar al rancho.
          </p>
        </div>`
      : "";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/></head>
      <body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          
          <!-- Header -->
          <div style="background:#0a0a0a;padding:32px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MACAO</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;text-transform:uppercase;letter-spacing:2px;">Adventure Park</p>
          </div>

          <!-- Body -->
          <div style="padding:32px 24px;">
            <div style="text-align:center;margin-bottom:24px;">
              <div style="display:inline-block;width:56px;height:56px;background:#dcfce7;border-radius:50%;line-height:56px;font-size:28px;">✓</div>
              <h2 style="margin:12px 0 4px;font-size:22px;color:#0a0a0a;">¡Reserva Confirmada!</h2>
              <p style="margin:0;font-size:14px;color:#71717a;">Hola ${customer.name}, tu reserva ha sido procesada exitosamente.</p>
            </div>

            <!-- Items table -->
            <table style="width:100%;border-collapse:collapse;margin:20px 0;">
              <thead>
                <tr style="background:#f8f9fa;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Artículo</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Cant.</th>
                  <th style="padding:10px 12px;text-align:right;font-size:12px;color:#71717a;text-transform:uppercase;letter-spacing:0.5px;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding:12px;font-size:14px;font-weight:700;color:#0a0a0a;">Total pagado</td>
                  <td style="padding:12px;font-size:16px;font-weight:700;color:#0a0a0a;text-align:right;">$${totalPaid.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>

            <!-- Payment info -->
            <div style="padding:12px 16px;background:#f8f9fa;border-radius:8px;margin-bottom:8px;">
              <p style="margin:0;font-size:13px;color:#555;">
                <strong>Método de pago:</strong> ${paymentMethod === "card" ? "Tarjeta" : "PayPal"}
              </p>
            </div>

            ${remainingHtml}
            ${pickupHtml}

            <!-- Contact info -->
            <div style="margin-top:20px;padding:16px;background:#f0f9ff;border-radius:12px;">
              <p style="margin:0 0 8px;font-weight:600;font-size:14px;color:#333;">Tus datos</p>
              <p style="margin:0;font-size:13px;color:#555;">
                <strong>Nombre:</strong> ${customer.name}<br/>
                <strong>Teléfono:</strong> ${customer.phone}<br/>
                <strong>Email:</strong> ${customer.email}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div style="padding:20px 24px;background:#f8f9fa;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0 0 4px;font-size:12px;color:#71717a;">¿Tienes preguntas? Contáctanos</p>
            <p style="margin:0;font-size:12px;color:#71717a;">© ${new Date().getFullYear()} Macao Adventure Park. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const { data, error } = await getResend().emails.send({
      from: `Macao Adventure Park <reservas@${process.env.RESEND_DOMAIN || "resend.dev"}>`,
      to: customer.email,
      bcc: ["bookings@macaooffroad.com", "marketing@macaooffroad.com"],
      subject: `¡Reserva Confirmada! — Macao Adventure Park`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Email route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
