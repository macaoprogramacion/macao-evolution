"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "next-themes";
import { AuthModal } from "@/components/auth-modal";
import { clearCustomerSession, getCustomerSession } from "@/lib/customer-session";
import { clearSellerPortalSession } from "@/lib/sellers-session";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const refreshUser = async () => {
      const session = await getCustomerSession();
      setUserName(session?.name || session?.email || null);
    };

    refreshUser();
    window.addEventListener("macao-auth-changed", refreshUser);

    return () => {
      window.removeEventListener("macao-auth-changed", refreshUser);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await clearCustomerSession();
    await clearSellerPortalSession();
    setIsProfileMenuOpen(false);
    setIsMobileProfileOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <>
    <header 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl ${isMenuOpen ? "overflow-hidden bg-background/95 backdrop-blur-md rounded-2xl" : "bg-background/90 backdrop-blur-md rounded-2xl"}`}
      style={{
        boxShadow: "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px"
      }}
    >
      <div className="flex items-center justify-between px-2 pl-5 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo PNG/MACAO LOGO_Mesa de trabajo 1.png"
            alt="Macao Logo"
            width={1200}
            height={360}
            className="h-16 md:h-24 w-auto"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={() => { document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-lg font-semibold transition-colors text-muted-foreground hover:text-foreground"
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-lg font-semibold transition-colors text-muted-foreground hover:text-foreground"
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => { document.getElementById('transport')?.scrollIntoView({ behavior: 'smooth' }); }}
            className="text-lg font-semibold transition-colors text-muted-foreground hover:text-foreground"
          >
            Private Transportation
          </button>
          <Link
            href="/photographer"
            className="text-lg font-bold transition-colors text-amber-600 hover:text-amber-500"
          >
            Get my foto
          </Link>
        </nav>

        {/* CTA */}
        <div className="hidden items-center gap-4 md:flex">
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
          {userName ? (
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="px-4 py-2 text-base font-semibold rounded-full bg-foreground text-background hover:opacity-80"
              >
                {userName.split(" ")[0]}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background p-2 shadow-xl">
                  <Link
                    href="/reservas"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Mis reservas
                  </Link>
                  <Link
                    href="/regalar"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Regalar
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Ayuda
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    Contactanos
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 text-base font-semibold rounded-full bg-foreground text-background hover:opacity-80"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="transition-colors md:hidden text-foreground"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-border bg-background px-6 py-8 md:hidden rounded-b-2xl">
          <nav className="flex flex-col gap-6">
            <button
              type="button"
              className="text-xl font-semibold text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Services
            </button>
            <button
              type="button"
              className="text-xl font-semibold text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Products
            </button>
            <button
              type="button"
              className="text-xl font-semibold text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('transport')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Private Transportation
            </button>
            <Link
              href="/photographer"
              className="text-xl font-bold text-amber-600"
              onClick={() => setIsMenuOpen(false)}
            >
              Get my foto
            </Link>
            {userName ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsMobileProfileOpen((prev) => !prev)}
                  className="mt-2 flex w-full items-center justify-between text-left"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {userName.split(" ")[0]}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground transition-transform ${isMobileProfileOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isMobileProfileOpen && (
                  <>
                    <Link href="/reservas" onClick={() => setIsMenuOpen(false)} className="text-base text-foreground">
                      Mis reservas
                    </Link>
                    <Link
                      href="/regalar"
                      onClick={() => setIsMenuOpen(false)}
                      className="text-base text-foreground"
                    >
                      Regalar
                    </Link>
                    <Link href="/faq" onClick={() => setIsMenuOpen(false)} className="text-base text-foreground">
                      Ayuda
                    </Link>
                    <Link href="/contact" onClick={() => setIsMenuOpen(false)} className="text-base text-foreground">
                      Contactanos
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-4 bg-foreground px-5 py-3 text-center text-sm font-medium text-background rounded-full w-full"
                    >
                      Cerrar sesion
                    </button>
                  </>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsAuthOpen(true);
                }}
                className="mt-4 bg-foreground px-5 py-3 text-center text-sm font-medium text-background rounded-full w-full"
              >
                Sign in
              </button>
            )}
          </nav>
        </div>
      )}
    </header>

    {/* Auth Modal */}
    <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
