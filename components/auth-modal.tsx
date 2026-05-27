"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, User, Phone, Eye, EyeOff, ChevronRight, Briefcase, Users, Building2, Shield, ArrowLeft } from "lucide-react";
import { authenticateByEmail } from "@/lib/supabase-users";
import { issueCustomerEmailVerificationCode, loginCustomer, registerCustomer, requestPasswordReset, resetCustomerPassword, verifyCustomerEmailCode } from "@/lib/customer-accounts";
import { setCustomerSession, type CustomerSession } from "@/lib/customer-session";
import { setDashboardSession } from "@/lib/dashboard-session";
import { setSellerPortalSession } from "@/lib/sellers-session";

type UserRole = "cliente" | "representante" | "colaborador";

type AuthTab = "login" | "register";
type RegisterStep = "form" | "verify";
type ForgotStep = "email" | "code" | null;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function setSessionUser(data: CustomerSession) {
  await setCustomerSession(data);
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("login");
  const [registerStep, setRegisterStep] = useState<RegisterStep>("form");
  const [forgotStep, setForgotStep] = useState<ForgotStep>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotAccountId, setForgotAccountId] = useState<string | null>(null);
  const [forgotName, setForgotName] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const [forgotFallbackCode, setForgotFallbackCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("cliente");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPin, setAdminPin] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("cliente");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [verificationFallbackCode, setVerificationFallbackCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState<{
    id: string;
    name: string;
    phone: string;
    email: string;
    role: "cliente" | "representante";
  } | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setShowPassword(false);
      setIsLoading(false);
      setAdminEmail("");
      setAdminPin("");
      setRegisterStep("form");
      setVerificationCode("");
      setVerificationMessage("");
      setVerificationFallbackCode("");
      setPendingVerification(null);
      setForgotStep(null);
      setForgotEmail("");
      setForgotCode("");
      setForgotNewPassword("");
      setForgotConfirmPassword("");
      setForgotAccountId(null);
      setForgotName("");
      setForgotMessage("");
      setForgotFallbackCode("");
    }
  }, [isOpen]);

  function validateLogin() {
    const newErrors: Record<string, string> = {};
    if (!loginEmail.trim()) newErrors.loginEmail = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail))
      newErrors.loginEmail = "Correo inválido";
    if (!loginPassword.trim()) newErrors.loginPassword = "La contraseña es obligatoria";
    else if (loginPassword.length < 6)
      newErrors.loginPassword = "Mínimo 6 caracteres";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateRegister() {
    const newErrors: Record<string, string> = {};
    if (!regName.trim()) newErrors.regName = "El nombre es obligatorio";
    if (!regPhone.trim()) newErrors.regPhone = "El teléfono es obligatorio";
    else if (!/^[\d\s\-+()]{7,20}$/.test(regPhone))
      newErrors.regPhone = "Teléfono inválido";
    if (!regEmail.trim()) newErrors.regEmail = "El correo es obligatorio";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail))
      newErrors.regEmail = "Correo inválido";
    if (!regPassword.trim()) newErrors.regPassword = "La contraseña es obligatoria";
    else if (regPassword.length < 6)
      newErrors.regPassword = "Mínimo 6 caracteres";
    if (regPassword !== regConfirmPassword)
      newErrors.regConfirmPassword = "Las contraseñas no coinciden";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    // Admin email + code login
    if (loginRole === "colaborador") {
      const newErrors: Record<string, string> = {};
      if (!adminEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
        newErrors.adminEmail = "Ingresa un correo válido";
      }
      if (adminPin.length !== 6) {
        newErrors.adminPin = "El código debe ser de 6 dígitos";
      }
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setIsLoading(true);
      try {
        const user = await authenticateByEmail(adminEmail.trim().toLowerCase());
        if (user && String(user.pin) === String(adminPin)) {
          await setDashboardSession({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar_url: user.avatar_url || null, active: true });

          if (user.role === "representante") {
            const initials = user.name
              .split(" ")
              .map((w: string) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)

            await setSellerPortalSession({
              id: `REP-${String(user.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`,
              name: user.name,
              phone: user.phone || "",
              email: user.email,
              company: "Independiente",
              type: "local_seller",
              commissionPercent: 15,
              initials,
            })
          }

          onClose();
          const roleRoutes: Record<string, string> = {
            admin: '/admin',
            both: '/admin',
            billing: '/photographer/billing',
            photographer: '/photographer/dashboard',
            operaciones: '/admin/operation',
            chofer: '/admin/chofer',
            contabilidad: '/admin/contabilidad',
            representante: '/sellers/dashboard',
          };
          router.push(roleRoutes[user.role] || '/admin');
        } else {
          setErrors({ adminPin: "Correo o código incorrecto" });
          setAdminPin("");
        }
      } catch {
        setErrors({ adminPin: "Error de conexión. Intenta de nuevo." });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!validateLogin()) return;
    setIsLoading(true);

    const email = normalizeEmail(loginEmail);

    const { account: user, error: authError } = await loginCustomer({
      email,
      password: loginPassword,
      role: loginRole === "representante" ? "representante" : "cliente",
    });

    if (loginRole === "representante") {
      if (user) {
        const repId = `REP-${String(user.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
        const initials = user.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const repPayload = {
          id: repId,
          name: user.name,
          phone: user.phone,
          email: user.email,
          company: "Independiente",
          type: "local_seller",
          commissionPercent: 15,
          initials,
        };
        await setSellerPortalSession(repPayload);

        await setSessionUser({
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: loginRole,
          loggedInAt: new Date().toISOString(),
        });
        setIsLoading(false);
        onClose();
        router.push("/sellers/dashboard");
        return;
      }

      setErrors({ loginEmail: authError || "No se encontró una cuenta de representante con este correo." });
      setIsLoading(false);
      return;
    }

    if (!user) {
      setErrors({ loginEmail: authError || "No existe una cuenta con este correo" });
      setIsLoading(false);
      return;
    }

    await setSessionUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    });
    setIsLoading(false);
    onClose();
  }

  async function handleRegister() {
    if (!validateRegister()) return;
    setIsLoading(true);

    const { account: newUser, error } = await registerCustomer({
      name: regName.trim(),
      phone: regPhone.trim(),
      email: normalizeEmail(regEmail),
      password: regPassword,
      role: regRole === "representante" ? "representante" : "cliente",
    });

    if (!newUser) {
      setErrors({ regEmail: error || "No se pudo crear la cuenta" });
      setIsLoading(false);
      return;
    }

    const { code, error: codeError } = await issueCustomerEmailVerificationCode(newUser.id);
    if (codeError || !code) {
      setErrors({ regEmail: codeError || "No se pudo generar el código de verificación" });
      setIsLoading(false);
      return;
    }

    setPendingVerification({
      id: newUser.id,
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      role: newUser.role,
    });

    try {
      const response = await fetch("/api/send-register-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          code,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (payload?.code) {
        setVerificationFallbackCode(payload.code);
        setVerificationMessage("El correo no llegó. Usa el código que aparece a continuación:");
      } else {
        setVerificationFallbackCode("");
        setVerificationMessage(`Te enviamos un código de 6 dígitos a ${newUser.email}.`);
      }
    } catch {
      setVerificationMessage("No se pudo enviar el correo ahora. Puedes solicitar un nuevo código.");
    }

    setRegisterStep("verify");
    setVerificationCode("");
    setIsLoading(false);
  }

  async function handleVerifyEmailCode() {
    if (!pendingVerification) return;

    const code = verificationCode.trim();
    if (!/^\d{6}$/.test(code)) {
      setErrors({ verificationCode: "Ingresa un código de 6 dígitos." });
      return;
    }

    setIsLoading(true);
    setErrors({});

    const result = await verifyCustomerEmailCode(pendingVerification.id, code);
    if (!result.ok) {
      setErrors({ verificationCode: result.error || "No se pudo verificar el correo." });
      setIsLoading(false);
      return;
    }

    await setSessionUser({
      id: pendingVerification.id,
      name: pendingVerification.name,
      phone: pendingVerification.phone,
      email: pendingVerification.email,
      role: pendingVerification.role,
      loggedInAt: new Date().toISOString(),
    });

    if (pendingVerification.role === "representante") {
      const repId = `REP-${String(pendingVerification.id).replace(/-/g, "").slice(0, 8).toUpperCase()}`;
      const initials = pendingVerification.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      await setSellerPortalSession({
        id: repId,
        name: pendingVerification.name,
        phone: pendingVerification.phone,
        email: pendingVerification.email,
        company: "Independiente",
        type: "local_seller",
        commissionPercent: 15,
        initials,
      });
      setIsLoading(false);
      onClose();
      router.push("/sellers/dashboard");
      return;
    }

    setIsLoading(false);
    onClose();
  }

  async function handleResendCode() {
    if (!pendingVerification) return;
    setIsLoading(true);
    setErrors({});

    const { code, error } = await issueCustomerEmailVerificationCode(pendingVerification.id);
    if (error || !code) {
      setErrors({ verificationCode: error || "No se pudo reenviar el código." });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/send-register-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: pendingVerification.name,
          email: pendingVerification.email,
          role: pendingVerification.role,
          code,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (payload?.code) {
        setVerificationFallbackCode(payload.code);
        setVerificationMessage("El correo no llegó. Usa el código que aparece a continuación:");
      } else {
        setVerificationFallbackCode("");
        setVerificationMessage(`Te enviamos un nuevo código a ${pendingVerification.email}.`);
      }
    } catch {
      setErrors({ verificationCode: "No se pudo reenviar el código. Intenta de nuevo." });
    }

    setIsLoading(false);
  }

  async function handleForgotRequest() {
    const email = normalizeEmail(forgotEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ forgotEmail: "Ingresa un correo válido." });
      return;
    }
    setErrors({});
    setIsLoading(true);

    const role = loginRole === "representante" ? "representante" : "cliente";
    const { accountId, name, code, error } = await requestPasswordReset(email, role);

    if (error) {
      setErrors({ forgotEmail: error });
      setIsLoading(false);
      return;
    }

    // Even if account not found we proceed (avoid enumeration)
    if (accountId && code) {
      setForgotAccountId(accountId);
      setForgotName(name ?? "");
      try {
        const res = await fetch("/api/send-password-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name ?? email, email, code }),
        });
        const payload = await res.json().catch(() => null);
        if (payload?.code) {
          setForgotFallbackCode(payload.code);
          setForgotMessage("El correo no llegó. Usa el código que aparece a continuación:");
        } else {
          setForgotFallbackCode("");
          setForgotMessage(`Te enviamos un código de 6 dígitos a ${email}.`);
        }
      } catch {
        setForgotMessage("No se pudo enviar el correo. Intenta de nuevo.");
      }
    } else {
      setForgotMessage(`Si existe una cuenta con ${email}, recibirás un código.`);
    }

    setForgotStep("code");
    setIsLoading(false);
  }

  async function handleForgotReset() {
    const newErrors: Record<string, string> = {};
    if (!/^\d{6}$/.test(forgotCode.trim())) newErrors.forgotCode = "Ingresa un código de 6 dígitos.";
    if (forgotNewPassword.length < 6) newErrors.forgotNewPassword = "Mínimo 6 caracteres.";
    if (forgotNewPassword !== forgotConfirmPassword) newErrors.forgotConfirmPassword = "Las contraseñas no coinciden.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    if (!forgotAccountId) {
      setErrors({ forgotCode: "Sesión inválida. Vuelve a intentarlo." });
      return;
    }

    setErrors({});
    setIsLoading(true);
    const { ok, error } = await resetCustomerPassword(forgotAccountId, forgotCode.trim(), forgotNewPassword);
    setIsLoading(false);

    if (!ok) {
      setErrors({ forgotCode: error || "No se pudo restablecer la contraseña." });
      return;
    }

    // Back to login with success message
    setForgotStep(null);
    setForgotEmail("");
    setForgotCode("");
    setForgotNewPassword("");
    setForgotConfirmPassword("");
    setForgotAccountId(null);
    setForgotName("");
    setForgotFallbackCode("");
    setErrors({ loginPassword: "✓ Contraseña actualizada. Inicia sesión con tu nueva contraseña." });
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-background shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>

          {/* ── Forgot password: email step ── */}
          {forgotStep === "email" && (
            <div className="p-6">
              <button
                type="button"
                onClick={() => { setForgotStep(null); setErrors({}); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h2 className="text-xl font-bold mb-1">Restablecer contraseña</h2>
              <p className="text-sm text-muted-foreground mb-6">Ingresa tu correo y te enviaremos un código de 6 dígitos.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Correo electrónico</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setErrors({}); }}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {errors.forgotEmail && <p className="mt-1 text-xs text-red-500">{errors.forgotEmail}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleForgotRequest}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {isLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> Enviando...</> : <>Enviar código <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Forgot password: code + new password step ── */}
          {forgotStep === "code" && (
            <div className="p-6">
              <button
                type="button"
                onClick={() => { setForgotStep("email"); setErrors({}); }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft size={14} /> Volver
              </button>
              <h2 className="text-xl font-bold mb-1">Nueva contraseña</h2>
              {forgotMessage && <p className="text-sm text-muted-foreground mb-3">{forgotMessage}</p>}
              {forgotFallbackCode && (
                <div className="mb-5 rounded-xl border-2 border-foreground bg-foreground/5 p-4 text-center">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Tu código</p>
                  <p className="text-4xl font-black tracking-[0.3em] text-foreground">{forgotFallbackCode}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Código de 6 dígitos</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={forgotCode}
                    onChange={(e) => { setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setErrors({}); }}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring tracking-widest text-center font-mono text-lg"
                  />
                  {errors.forgotCode && <p className="mt-1 text-xs text-red-500">{errors.forgotCode}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={forgotNewPassword}
                      onChange={(e) => { setForgotNewPassword(e.target.value); setErrors({}); }}
                      className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.forgotNewPassword && <p className="mt-1 text-xs text-red-500">{errors.forgotNewPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Repite la contraseña"
                      value={forgotConfirmPassword}
                      onChange={(e) => { setForgotConfirmPassword(e.target.value); setErrors({}); }}
                      className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  {errors.forgotConfirmPassword && <p className="mt-1 text-xs text-red-500">{errors.forgotConfirmPassword}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleForgotReset}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {isLoading ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> Guardando...</> : <>Cambiar contraseña <ChevronRight size={16} /></>}
                </button>
              </div>
            </div>
          )}

          {/* ── Normal tabs (hidden when forgot flow is active) ── */}
          {!forgotStep && (<>
          <div className="flex border-b border-border">
            <button
              type="button"
              onClick={() => { setTab("login"); setErrors({}); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setTab("register"); setErrors({}); }}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                tab === "register"
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Registrarse
            </button>
          </div>

          {/* ===== LOGIN ===== */}
          {tab === "login" && (
            <div className="px-8 py-8">
              <h2 className="text-xl font-title text-foreground mb-1">
                {loginRole === "cliente" ? "Iniciar sesión" : "Bienvenido de vuelta"}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ingresa tus credenciales para acceder
              </p>

              <div className="space-y-4">
                {/* Role selector */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">
                    Tipo de cuenta
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => { setLoginRole("cliente"); setErrors({}); }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        loginRole === "cliente"
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <User size={14} />
                      Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginRole("representante"); setErrors({}); }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        loginRole === "representante"
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <Briefcase size={14} />
                      Representante
                    </button>
                    <button
                      type="button"
                      onClick={() => { setLoginRole("colaborador"); setErrors({}); }}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        loginRole === "colaborador"
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <Users size={14} />
                      Colaborador
                    </button>
                  </div>
                </div>

                {/* Admin email + code input */}
                {loginRole === "colaborador" ? (
                  <>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Correo de acceso
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          value={adminEmail}
                          onChange={(e) => { setAdminEmail(e.target.value); setErrors({}); }}
                          placeholder="correo@empresa.com"
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                            errors.adminEmail ? "border-red-500" : "border-border"
                          }`}
                        />
                      </div>
                      {errors.adminEmail && (
                        <p className="mt-1 text-xs text-red-500">{errors.adminEmail}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Código de acceso
                      </label>
                      <div className="relative">
                        <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          value={adminPin}
                          onChange={(e) => { if (/^\d{0,6}$/.test(e.target.value)) { setAdminPin(e.target.value); setErrors({}); } }}
                          placeholder="••••••"
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 tracking-[0.5em] text-center font-mono ${
                            errors.adminPin ? "border-red-500" : "border-border"
                          }`}
                        />
                      </div>
                      {errors.adminPin && (
                        <p className="mt-1 text-xs text-red-500">{errors.adminPin}</p>
                      )}
                      <p className="mt-2 text-xs text-muted-foreground">
                        Ingresa tu correo y el código de 6 dígitos proporcionado por el administrador
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Email */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Correo electrónico
                      </label>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="tu@correo.com"
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                            errors.loginEmail ? "border-red-500" : "border-border"
                          }`}
                        />
                      </div>
                      {errors.loginEmail && (
                        <p className="mt-1 text-xs text-red-500">{errors.loginEmail}</p>
                      )}
                    </div>

                    {/* Password */}
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">
                        Contraseña
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className={`w-full rounded-xl border bg-background py-3 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                            errors.loginPassword ? "border-red-500" : "border-border"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {errors.loginPassword && (
                        <p className="mt-1 text-xs text-red-500">{errors.loginPassword}</p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Forgot password */}
              {loginRole !== "colaborador" && (
                <div className="mt-3 text-right">
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => { setErrors({}); setForgotEmail(loginEmail); setForgotStep("email"); }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {/* Login button */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3.5 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ChevronRight size={16} />
                  </>
                )}
              </button>

              {/* Switch to register */}
              <p className="mt-6 text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("register"); setErrors({}); }}
                  className="font-semibold text-foreground hover:underline"
                >
                  Regístrate
                </button>
              </p>
            </div>
          )}

          {/* ===== REGISTER ===== */}
          {tab === "register" && (
            <div className="px-8 py-6">
              <h2 className="text-xl font-title text-foreground mb-1">
                {registerStep === "form" ? "Crear cuenta" : "Verifica tu correo"}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                {registerStep === "form"
                  ? "Regístrate para reservar tu experiencia"
                  : `Ingresa el código de 6 dígitos enviado a ${pendingVerification?.email || "tu correo"}`}
              </p>

              {registerStep === "form" ? (
                <div className="space-y-3">
                  {/* Role selector */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Tipo de cuenta
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRegRole("cliente")}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          regRole === "cliente"
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <User size={16} />
                        Cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegRole("representante")}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          regRole === "representante"
                            ? "border-foreground bg-foreground text-background shadow-sm"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                        }`}
                      >
                        <Briefcase size={16} />
                        Representante
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      {regRole === "representante" ? "Nombre del representante" : "Nombre completo"}
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="Juan Pérez"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.regName ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.regName && (
                      <p className="mt-1 text-xs text-red-500">{errors.regName}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Número de teléfono
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+1 (809) 555-0123"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.regPhone ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.regPhone && (
                      <p className="mt-1 text-xs text-red-500">{errors.regPhone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="juan@ejemplo.com"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.regEmail ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.regEmail && (
                      <p className="mt-1 text-xs text-red-500">{errors.regEmail}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.regPassword ? "border-red-500" : "border-border"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.regPassword && (
                      <p className="mt-1 text-xs text-red-500">{errors.regPassword}</p>
                    )}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Confirmar contraseña
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repite tu contraseña"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.regConfirmPassword ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.regConfirmPassword && (
                      <p className="mt-1 text-xs text-red-500">{errors.regConfirmPassword}</p>
                    )}
                  </div>

                  {/* Register button */}
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Creando cuenta...
                      </>
                    ) : (
                      <>
                        Crear cuenta
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-foreground">
                      Código de verificación
                    </label>
                    <div className="relative">
                      <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={verificationCode}
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "").slice(0, 6);
                          setVerificationCode(cleaned);
                          setErrors({});
                        }}
                        placeholder="123456"
                        className={`w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm tracking-[0.35em] text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors focus:ring-2 focus:ring-foreground/20 ${
                          errors.verificationCode ? "border-red-500" : "border-border"
                        }`}
                      />
                    </div>
                    {errors.verificationCode && (
                      <p className="mt-1 text-xs text-red-500">{errors.verificationCode}</p>
                    )}
                    {verificationMessage && (
                      <p className="mt-1 text-xs text-muted-foreground">{verificationMessage}</p>
                    )}
                    {verificationFallbackCode && (
                      <div className="mt-3 rounded-xl border-2 border-foreground bg-foreground/5 p-4 text-center">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">Tu código</p>
                        <p className="text-4xl font-black tracking-[0.3em] text-foreground">{verificationFallbackCode}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyEmailCode}
                    disabled={isLoading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-foreground py-3 text-sm font-semibold text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        Confirmar código
                        <ChevronRight size={16} />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="font-semibold text-foreground hover:underline disabled:opacity-50"
                    >
                      Reenviar código
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRegisterStep("form");
                        setVerificationCode("");
                        setVerificationMessage("");
                        setPendingVerification(null);
                        setErrors({});
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cambiar datos
                    </button>
                  </div>
                </div>
              )}

              {/* Switch to login */}
              <p className="mt-4 text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{" "}
                <button
                  type="button"
                  onClick={() => { setTab("login"); setErrors({}); }}
                  className="font-semibold text-foreground hover:underline"
                >
                  Inicia sesión
                </button>
              </p>
            </div>
          )}
          </>)}
        </div>
      </div>
    </>
  );
}
