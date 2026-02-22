"use client";

import { useState, useEffect } from "react";
import { X, Mail, Lock, User, Phone, Eye, EyeOff, ChevronRight } from "lucide-react";

type AuthTab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

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

  function handleLogin() {
    if (!validateLogin()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // TODO: Implement real login
      console.log("Login:", { email: loginEmail });
      onClose();
    }, 1500);
  }

  function handleRegister() {
    if (!validateRegister()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // TODO: Implement real register
      console.log("Register:", { name: regName, phone: regPhone, email: regEmail });
      onClose();
    }, 1500);
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

          {/* Tabs */}
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
              <h2 className="text-xl font-bold text-foreground mb-1">
                Bienvenido de vuelta
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Ingresa tus credenciales para acceder
              </p>

              <div className="space-y-4">
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
              </div>

              {/* Forgot password */}
              <div className="mt-3 text-right">
                <button type="button" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

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
              <h2 className="text-xl font-bold text-foreground mb-1">
                Crear cuenta
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Regístrate para reservar tu experiencia
              </p>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Nombre completo
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
        </div>
      </div>
    </>
  );
}
