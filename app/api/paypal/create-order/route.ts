import { NextRequest, NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawAmount = Number(body?.amount);
    const amount = Number.isFinite(rawAmount) ? rawAmount : 0;

    if (amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const order = await createPayPalOrder({
      amount,
      currency: body?.currency || "USD",
      description: body?.description,
    });

    return NextResponse.json({ id: order.id, status: order.status });
  } catch (error) {
    console.error("PayPal create-order error:", error);
    return NextResponse.json({ error: "Unable to create PayPal order" }, { status: 500 });
  }
}
