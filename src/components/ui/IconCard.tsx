import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  text: string;
  dark?: boolean;
  /**
   * - `stacked` (default): icon, then title, then description.
   * - `inline`: the icon tile on the left, title and description stacked to its right, in
   *   smaller type (15px title, so "Arhivare Electronică Acreditată" fits one line in the
   *   eMIP Arch grid).
   * - `title-row`: the title beside the icon, the description and any extras below them at
   *   the card's full width. 17px title, so "Firme de Consultanță" fits beside the icon in a
   *   four-column row.
   */
  layout?: "stacked" | "inline" | "title-row";
  children?: ReactNode;
};

export function IconCard({ icon: Icon, title, text, dark = false, layout = "stacked", children }: Props) {
  const iconTile = (
    <div
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
        dark ? "bg-brand-400/15 text-brand-300" : "bg-brand-50 text-brand-700"
      }`}
    >
      <Icon aria-hidden className="size-5" />
    </div>
  );
  const titleSize = { stacked: "mt-5 text-lg", inline: "text-[15px] leading-6", "title-row": "text-[17px] leading-snug" }[layout];
  const heading = <h3 className={`font-semibold ${titleSize} ${dark ? "text-white" : ""}`}>{title}</h3>;
  const description = (
    <p
      className={`leading-relaxed ${{ stacked: "mt-2", inline: "mt-1.5 text-sm", "title-row": "mt-4" }[layout]} ${
        dark ? "text-slate-300" : "text-slate-600"
      }`}
    >
      {text}
    </p>
  );

  return (
    <div
      className={`flex rounded-2xl border p-6 transition-shadow ${layout === "inline" ? "flex-row items-start gap-3" : "flex-col"} ${
        dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white hover:shadow-lg hover:shadow-navy-900/5"
      }`}
    >
      {layout === "inline" ? (
        <>
          {iconTile}
          {/* pt-2.5 centres the title's first line (24px) on the 44px icon tile. */}
          <div className="min-w-0 pt-2.5">
            {heading}
            {description}
            {children}
          </div>
        </>
      ) : layout === "title-row" ? (
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
