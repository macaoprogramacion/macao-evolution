"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, User, Phone, Eye, EyeOff, ChevronRight, Briefcase, Users, Building2 } from "lucide-react";

type UserRole = "cliente" | "representante";

type AuthTab = "login" | "register";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginRole, setLoginRole] = useState<UserRole>("cliente");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regRole, setRegRole] = useState<UserRole>("cliente");

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

      // If representative, find their account and redirect to sellers panel
      if (loginRole === "representante") {
        // Check mock representatives
        const mockRepEmails: Record<string, string> = {
          "carlos.mendez@excursionespca na.com": "REP-001",
          "ana.rodriguez@viajesdominicanos.com": "REP-002",
          "miguel.torres@barcelo.com": "REP-003",
          "laura.pena@gmail.com": "REP-004",
          "f.rosario@dreamsresort.com": "REP-005",
        };

        // Check registered reps from localStorage
        const registeredReps = JSON.parse(localStorage.getItem("macao-registered-reps") || "[]");
        const registeredRep = registeredReps.find((r: any) => r.email === loginEmail);
        const mockRepId = mockRepEmails[loginEmail.toLowerCase()];

        if (registeredRep) {
          localStorage.setItem("sellers-rep-id", registeredRep.id);
          localStorage.setItem("macao-user", JSON.stringify({
            email: loginEmail,
            role: loginRole,
            loggedInAt: new Date().toISOString(),
          }));
          onClose();
          router.push("/sellers/dashboard");
        } else if (mockRepId) {
          localStorage.setItem("sellers-rep-id", mockRepId);
          localStorage.setItem("macao-user", JSON.stringify({
            email: loginEmail,
            role: loginRole,
            loggedInAt: new Date().toISOString(),
          }));
          onClose();
          router.push("/sellers/dashboard");
        } else {
          setErrors({ loginEmail: "No se encontró una cuenta de representante con este correo. Regístrate primero." });
        }
      } else {
        // Client login
        localStorage.setItem("macao-user", JSON.stringify({
          email: loginEmail,
          role: loginRole,
          loggedInAt: new Date().toISOString(),
        }));
        onClose();
      }
    }, 1500);
  }

  function handleRegister() {
    if (!validateRegister()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);

      // Store user session
      const userData = {
        name: regName,
        phone: regPhone,
        email: regEmail,
        role: regRole,
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem("macao-user", JSON.stringify(userData));

      // If representative, register and redirect to sellers panel
      if (regRole === "representante") {
        const initials = regName
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        const newRep = {
          id: `REP-${Date.now()}`,
          name: regName,
          phone: regPhone,
          email: regEmail,
          company: "Independiente",
          type: "local_seller",
          commissionPercent: 15,
          initials,
        };

        // Save to registered reps list
        const registeredReps = JSON.parse(localStorage.getItem("macao-registered-reps") || "[]");
        registeredReps.push(newRep);
        localStorage.setItem("macao-registered-reps", JSON.stringify(registeredReps));
        localStorage.setItem("sellers-rep-id", newRep.id);

        onClose();
        router.push("/sellers/dashboard");
      } else {
        onClose();
      }
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
              <h2 className="text-xl font-title text-foreground mb-1">
                Bienvenido de vuelta
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setLoginRole("cliente")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        loginRole === "cliente"
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <User size={16} />
                      Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginRole("representante")}
                      className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                        loginRole === "representante"
                          ? "border-foreground bg-foreground text-background shadow-sm"
                          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      }`}
                    >
                      <Briefcase size={16} />
                      Representante
                    </button>
                  </div>
                </div>

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
              <h2 className="text-xl font-title text-foreground mb-1">
                Crear cuenta
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Regístrate para reservar tu experiencia
              </p>

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
