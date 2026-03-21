"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { AuthModal } from "@/components/auth-modal";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <header 
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-3xl transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md rounded-full" : "bg-transparent"}`}
      style={{
        boxShadow: isScrolled ? "rgba(14, 63, 126, 0.04) 0px 0px 0px 1px, rgba(42, 51, 69, 0.04) 0px 1px 1px -0.5px, rgba(42, 51, 70, 0.04) 0px 3px 3px -1.5px, rgba(42, 51, 70, 0.04) 0px 6px 6px -3px, rgba(14, 63, 126, 0.04) 0px 12px 12px -6px, rgba(14, 63, 126, 0.04) 0px 24px 24px -12px" : "none"
      }}
    >
      <div className="flex items-center justify-between transition-all duration-300 px-2 pl-5 py-2">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png"
            alt="Macao Logo"
            width={160}
            height={48}
            className={`h-10 w-auto transition-all duration-300 ${isScrolled ? "" : "brightness-0 invert"}`}
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={() => { document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
            className={`text-sm transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Services
          </button>
          <button
            type="button"
            onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
            className={`text-sm transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Products
          </button>
          <button
            type="button"
            onClick={() => { document.getElementById('transport')?.scrollIntoView({ behavior: 'smooth' }); }}
            className={`text-sm transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Private Transportation
          </button>
          <Link
            href="/photographer"
            className={`text-sm transition-colors ${isScrolled ? "text-muted-foreground hover:text-foreground" : "text-white/70 hover:text-white"}`}
          >
            Get my photos
          </Link>
        </nav>

        {/* CTA */}
        <div className="hidden items-center gap-6 md:flex">
          <button
            type="button"
            onClick={() => setIsAuthOpen(true)}
            className={`px-4 py-2 text-sm font-medium transition-all rounded-full ${isScrolled ? "bg-foreground text-background hover:opacity-80" : "bg-white text-foreground hover:bg-white/90"}`}
          >
            Sign in
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`transition-colors md:hidden ${isScrolled ? "text-foreground" : "text-white"}`}
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
              className="text-lg text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Services
            </button>
            <button
              type="button"
              className="text-lg text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Products
            </button>
            <button
              type="button"
              className="text-lg text-foreground text-left"
              onClick={() => { setIsMenuOpen(false); document.getElementById('transport')?.scrollIntoView({ behavior: 'smooth' }); }}
            >
              Private Transportation
            </button>
            <Link
              href="/photographer"
              className="text-lg text-foreground"
              onClick={() => setIsMenuOpen(false)}
            >
              Get my photos
            </Link>
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
          </nav>
        </div>
      )}
    </header>

    {/* Auth Modal */}
    <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
