import { NextRequest, NextResponse } from "next/server";
import { capturePayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderId = String(body?.orderId || "").trim();

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const capture = await capturePayPalOrder(orderId);
    return NextResponse.json({
      orderId: capture?.id || orderId,
      status: capture?.status,
      capture,
    });
  } catch (error) {
    console.error("PayPal capture-order error:", error);
    return NextResponse.json({ error: "Unable to capture PayPal order" }, { status: 500 });
  }
}
