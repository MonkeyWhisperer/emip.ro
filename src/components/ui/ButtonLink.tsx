import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { SmartLink } from "./SmartLink";

const variants = {
  primary: "bg-brand-400 text-navy-950 hover:bg-brand-300 shadow-lg shadow-brand-500/20",
  dark: "bg-navy-900 text-white hover:bg-navy-800",
  outline: "border border-navy-200 text-navy-900 hover:border-navy-600 hover:bg-navy-50",
  "outline-light": "border border-white/30 text-white hover:border-white hover:bg-white/10",
};

type Props = {
  href: string;
  variant?: keyof typeof variants;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ href, variant = "primary", arrow = false, className = "", children }: Props) {
  return (
    <SmartLink
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors ${variants[variant]} ${className}`}
    >
      {children}
      {arrow && <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />}
    </SmartLink>
  );
}
