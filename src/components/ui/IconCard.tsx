import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  dark?: boolean;
  /**
   * - `stacked` (default): icon, then title, then description.
   * - `title-row`: the title beside the icon, the description and any extras below them at
   *   the card's full width. 17px title, so "Firme de Consultanță" fits beside the icon in a
   *   four-column row.
   */
  layout?: "stacked" | "title-row";
  /**
   * `title-row` only: 15px title and 14px description, so "Eficiență și Automatizare" fits
   * beside the icon in the four-column Benefits row, and "Arhivare Electronică Acreditată" in
   * the eMIP Arch grid.
   */
  compact?: boolean;
  children?: ReactNode;
};

export function IconCard({ icon: Icon, title, text, dark = false, layout = "stacked", compact = false, children }: Props) {
  const iconTile = (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
        dark ? "bg-brand-400/15 text-brand-300" : "bg-brand-50 text-brand-700"
      }`}
    >
      <Icon aria-hidden className="size-5" />
    </div>
  );
  const titleSize = {
    stacked: "mt-5 text-lg",
    "title-row": compact ? "text-[15px] leading-snug" : "text-[17px] leading-snug",
  }[layout];
  const heading = <h3 className={`font-semibold ${titleSize} ${dark ? "text-white" : ""}`}>{title}</h3>;
  const description = (
    <p
      className={`leading-relaxed ${{ stacked: "mt-2", "title-row": compact ? "mt-3 text-sm" : "mt-4" }[layout]} ${
        dark ? "text-slate-300" : "text-slate-600"
      }`}
    >
      {text}
    </p>
  );

  return (
    <div
      className={`flex flex-col rounded-2xl border p-6 transition-shadow ${
        dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white hover:shadow-lg hover:shadow-navy-900/5"
      }`}
    >
      {layout === "title-row" ? (
        <>
          <div className="flex items-center gap-3">
            {iconTile}
            {heading}
          </div>
          {description}
          {children}
        </>
      ) : (
        <>
          {iconTile}
          {heading}
          {description}
          {children}
        </>
      )}
    </div>
  );
}
