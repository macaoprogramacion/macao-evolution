const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

function getPayPalBaseUrl() {
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function getBasicAuthHeader() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error("PayPal credentials are missing. Define PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.");
  }

  const encoded = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  return `Basic ${encoded}`;
}

export async function getPayPalAccessToken() {
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: getBasicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`PayPal auth failed: ${details}`);
  }

  const payload = await response.json();
  return payload.access_token as string;
}

export async function createPayPalOrder(input: {
  amount: number;
  currency?: string;
  description?: string;
}) {
  const accessToken = await getPayPalAccessToken();
  const currency = input.currency || "USD";

  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: input.amount.toFixed(2),
          },
          description: input.description || "Reserva en Macao Evolution",
        },
      ],
    }),
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "PayPal order creation failed");
  }

  return payload;
}

export async function capturePayPalOrder(orderId: string) {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    cache: "no-store",
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || "PayPal capture failed");
  }

  return payload;
}
