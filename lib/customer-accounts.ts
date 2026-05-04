import { supabase } from "@/lib/supabase";

export type CustomerRole = "cliente" | "representante";
export type PaymentOption = "full" | "partial";
export type PaymentMethod = "card" | "paypal";

export interface CustomerAccount {
  id: string;
  name: string;
  phone: string;
  email: string;
  password_hash: string;
  role: CustomerRole;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerEmailVerification {
  account_id: string;
  code_hash: string;
  expires_at: string;
  verified_at: string | null;
}

export interface CustomerProfile {
  account_id: string;
  full_name: string | null;
  phone: string | null;
  last_payment_option: PaymentOption | null;
  last_payment_method: PaymentMethod | null;
  card_number: string | null;
  card_expiry: string | null;
  card_cvc: string | null;
  card_last4: string | null;
  card_holder_name: string | null;
  pickup_mode: "hotel" | "custom" | null;
  pickup_hotel: string | null;
  pickup_custom: string | null;
  updated_at: string;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function sha256Hex(input: string) {
  const encoded = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function findCustomerByEmail(email: string, role?: CustomerRole) {
  let query = supabase
    .from("customer_accounts")
    .select("id, name, phone, email, password_hash, role, active, created_at, updated_at")
    .eq("email", normalizeEmail(email))
    .eq("active", true)
    .limit(1);

  if (role) query = query.eq("role", role);

  const { data, error } = await query.single();
  if (error || !data) return null;
  return data as CustomerAccount;
}

export async function getCustomerById(accountId: string) {
  const { data, error } = await supabase
    .from("customer_accounts")
    .select("id, name, phone, email, password_hash, role, active, created_at, updated_at")
    .eq("id", accountId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomerAccount;
}

async function getVerificationByAccountId(accountId: string) {
  const { data, error } = await supabase
    .from("customer_email_verifications")
    .select("account_id, code_hash, expires_at, verified_at")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) return null;
  return (data ?? null) as CustomerEmailVerification | null;
}

export async function issueCustomerEmailVerificationCode(accountId: string) {
  const code = `${Math.floor(100000 + Math.random() * 900000)}`;
  const codeHash = await sha256Hex(code);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("customer_email_verifications")
    .upsert(
      {
        account_id: accountId,
        code_hash: codeHash,
        expires_at: expiresAt,
        verified_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "account_id" },
    );

  if (error) {
    return { code: null, error: "No se pudo generar el código de verificación" };
  }

  return { code, error: null };
}

export async function verifyCustomerEmailCode(accountId: string, code: string) {
  const verification = await getVerificationByAccountId(accountId);

  // Backward compatibility: old accounts without verification row are treated as verified.
  if (!verification) return { ok: true, error: null };
  if (verification.verified_at) return { ok: true, error: null };

  const now = new Date();
  if (new Date(verification.expires_at) < now) {
    return { ok: false, error: "El código expiró. Solicita uno nuevo." };
  }

  const codeHash = await sha256Hex(code.trim());
  if (codeHash !== verification.code_hash) {
    return { ok: false, error: "El código ingresado no es válido." };
  }

  const { error } = await supabase
    .from("customer_email_verifications")
    .update({
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("account_id", accountId);

  if (error) {
    return { ok: false, error: "No se pudo confirmar el correo. Intenta de nuevo." };
  }

  return { ok: true, error: null };
}

export async function isCustomerEmailVerified(accountId: string) {
  const verification = await getVerificationByAccountId(accountId);
  if (!verification) return true;
  return !!verification.verified_at;
}

export async function registerCustomer(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: CustomerRole;
}) {
  const existing = await findCustomerByEmail(input.email, input.role);
  if (existing) {
    return { account: null, error: "Ya existe una cuenta con este correo" };
  }

  const passwordHash = await sha256Hex(input.password);

  const { data, error } = await supabase
    .from("customer_accounts")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: normalizeEmail(input.email),
      password_hash: passwordHash,
      role: input.role,
      active: true,
    })
    .select("id, name, phone, email, password_hash, role, active, created_at, updated_at")
    .single();

  if (error || !data) {
    return { account: null, error: "No se pudo crear la cuenta" };
  }

  return { account: data as CustomerAccount, error: null };
}

export async function loginCustomer(input: {
  email: string;
  password: string;
  role: CustomerRole;
}) {
  const account = await findCustomerByEmail(input.email, input.role);
  if (!account) {
    return { account: null, error: "No existe una cuenta con este correo" };
  }

  const passwordHash = await sha256Hex(input.password);
  if (account.password_hash !== passwordHash) {
    return { account: null, error: "Contraseña incorrecta" };
  }

  const isVerified = await isCustomerEmailVerified(account.id);
  if (!isVerified) {
    return {
      account: null,
      error: "Debes verificar tu correo con el código que te enviamos para poder iniciar sesión.",
    };
  }

  return { account, error: null };
}

export async function getCustomerProfile(accountId: string) {
  const { data, error } = await supabase
    .from("customer_profiles")
    .select("account_id, full_name, phone, last_payment_option, last_payment_method, card_number, card_expiry, card_cvc, card_last4, card_holder_name, pickup_mode, pickup_hotel, pickup_custom, updated_at")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error || !data) return null;
  return data as CustomerProfile;
}

export async function upsertCustomerProfile(input: {
  accountId: string;
  fullName?: string;
  phone?: string;
  paymentOption?: PaymentOption;
  paymentMethod?: PaymentMethod;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvc?: string;
  cardLast4?: string;
  cardHolderName?: string;
  pickupMode?: "hotel" | "custom";
  pickupHotel?: string;
  pickupCustom?: string;
}) {
  const { error } = await supabase.from("customer_profiles").upsert(
    {
      account_id: input.accountId,
      full_name: input.fullName ?? null,
      phone: input.phone ?? null,
      last_payment_option: input.paymentOption ?? null,
      last_payment_method: input.paymentMethod ?? null,
      card_number: input.cardNumber ?? null,
      card_expiry: input.cardExpiry ?? null,
      card_cvc: input.cardCvc ?? null,
      card_last4: input.cardLast4 ?? null,
      card_holder_name: input.cardHolderName ?? null,
      pickup_mode: input.pickupMode ?? null,
      pickup_hotel: input.pickupHotel ?? null,
      pickup_custom: input.pickupCustom ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "account_id" },
  );

  if (error) {
    console.error("Error updating customer profile:", error);
  }
}

// ── Password reset ────────────────────────────────────────────────────────────

export async function requestPasswordReset(email: string, role: CustomerRole) {
  const account = await findCustomerByEmail(email, role);
  if (!account) {
    // Return success to avoid user enumeration
    return { accountId: null, error: null };
  }
  const { code, error } = await issueCustomerEmailVerificationCode(account.id);
  if (error || !code) {
    return { accountId: null, error: "No se pudo generar el código. Intenta de nuevo." };
  }
  return { accountId: account.id, name: account.name, code, error: null };
}

export async function resetCustomerPassword(accountId: string, code: string, newPassword: string) {
  const result = await verifyCustomerEmailCode(accountId, code);
  if (!result.ok) return { ok: false, error: result.error };

  const passwordHash = await sha256Hex(newPassword);
  const { error } = await supabase
    .from("customer_accounts")
    .update({ password_hash: passwordHash, updated_at: new Date().toISOString() })
    .eq("id", accountId);

  if (error) return { ok: false, error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  return { ok: true, error: null };
}
