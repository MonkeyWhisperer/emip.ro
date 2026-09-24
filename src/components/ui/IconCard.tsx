import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  dark?: boolean;
  children?: ReactNode;
};

export function IconCard({ icon: Icon, title, text, dark = false, children }: Props) {
  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 transition-shadow ${
        dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white hover:shadow-lg hover:shadow-navy-900/5"
      }`}
    >
      <div
        className={`flex size-11 items-center justify-center rounded-xl ${
          dark ? "bg-brand-400/15 text-brand-300" : "bg-brand-50 text-brand-700"
        }`}
      >
        <Icon aria-hidden className="size-5" />
      </div>
      <h3 className={`mt-5 text-lg font-semibold ${dark ? "text-white" : ""}`}>{title}</h3>
      <p className={`mt-2 leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>{text}</p>
      {children}
    </div>
  );
}
