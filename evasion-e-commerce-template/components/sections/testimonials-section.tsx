"use client";

import Image from "next/image";

export function TestimonialsText() {
  return (
    <section className="bg-background">
      <div className="px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40">
        <p className="mx-auto max-w-5xl text-2xl leading-relaxed text-foreground md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          All our clients include pickup. Clients at all-inclusive resorts and hotels are picked up at the security gate. Clients at hotels and Airbnb are picked up at nearby meeting points.
        </p>
      </div>
    </section>
  );
}

export function TestimonialsImage() {
  return (
    <section id="about" className="bg-background">
      <div className="relative aspect-[16/9] w-full">
        <Image
          src="/images/Clientes/clientes%20(5).png"
          alt="Clientes disfrutando la aventura en buggy"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>
    </section>
  );
}

// Keep backward compat
export function TestimonialsSection() {
  return (
    <>
      <TestimonialsText />
      <TestimonialsImage />
    </>
  );
}
