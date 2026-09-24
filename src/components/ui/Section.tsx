import type { ReactNode } from "react";

const containerSizes = {
  default: "max-w-7xl",
  /** Reading width: blog posts. */
  narrow: "max-w-4xl",
};

/**
 * Centred page column with the site's side padding. Pick the width with `size`: a max-w-* in
 * `className` would not override the default one (both are utilities; the stylesheet order decides).
 */
export function Container({
  size = "default",
  className = "",
  children,
}: {
  size?: keyof typeof containerSizes;
  className?: string;
  children: ReactNode;
}) {
  return <div className={`mx-auto w-full ${containerSizes[size]} px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

type SectionProps = {
  id?: string;
  tone?: "white" | "muted" | "dark";
  className?: string;
  children: ReactNode;
};

const tones = {
  white: "bg-white",
  muted: "bg-slate-50",
  dark: "bg-navy-950 text-slate-200",
};

export function Section({ id, tone = "white", className = "", children }: SectionProps) {
  return (
    <section id={id} className={`py-20 sm:py-24 ${tones[tone]} ${className}`}>
      <Container>{children}</Container>
    </section>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  text?: string;
  dark?: boolean;
  align?: "center" | "left";
};

export function SectionHeader({ eyebrow, title, text, dark = false, align = "center" }: HeaderProps) {
  const alignment = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`max-w-3xl ${alignment}`}>
      <p className={`text-sm font-semibold uppercase tracking-wider ${dark ? "text-brand-400" : "text-brand-700"}`}>
        {eyebrow}
      </p>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${dark ? "text-white" : ""}`}>{title}</h2>
      {text && <p className={`mt-4 text-pretty text-lg leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>}
    </div>
  );
}
