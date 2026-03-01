import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/header";
import { FooterSection } from "@/components/sections/footer-section";
import { Button } from "@/components/ui/button";

export function StaticPageShell({
  title,
  subtitle,
  ctaHref,
  ctaLabel,
  children,
}: {
  title: string;
  subtitle: string;
  ctaHref?: string;
  ctaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />

      <section className="px-6 pt-28 pb-10 md:px-12 md:pt-32 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-center rounded-xl border border-border bg-secondary/40 px-4 py-5">
            <Image
              src="/Logo%20PNG/MACAO%20LOGO_Mesa%20de%20trabajo%201.png"
              alt="Macao Logo"
              width={220}
              height={72}
              className="h-12 w-auto md:h-14"
              priority
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em]" style={{ color: "#DC2626" }}>
            MACAO OFFROAD EXPERIENCE
          </p>
          <h1 className="mt-2 font-title text-3xl leading-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>

          {ctaHref && ctaLabel ? (
            <div className="mt-6">
              <Button asChild className="rounded-full px-6" style={{ backgroundColor: "#DC2626", color: "#FFFFFF" }}>
                <Link href={ctaHref}>{ctaLabel}</Link>
              </Button>
            </div>
          ) : null}
        </div>
      </section>

      <section className="px-6 pb-16 md:px-12 md:pb-20 lg:px-20">
        <div className="mx-auto max-w-4xl">{children}</div>
      </section>

      <FooterSection />
    </main>
  );
}
