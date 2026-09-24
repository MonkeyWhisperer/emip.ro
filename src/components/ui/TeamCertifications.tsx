import { Link } from "react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { highlight, highlightGroups } from "../../content/certificari";

/** A certification code; its full name is shown on hover and read out by screen readers. */
function Codes({ items }: { items: { line: string; title: string }[] }) {
  return items.map(({ line, title }, i) => (
    <span key={line}>
      {i > 0 && <span aria-hidden className="text-slate-400"> · </span>}
      <span title={title} className="font-medium text-navy-950">
        {line}
      </span>
      <span className="sr-only"> ({title})</span>
    </span>
  ));
}

/**
 * The team's main certifications (the ones marked `line` in content/certificari.ts, while valid)
 * on one centred line, with a link to /certificari (home page).
 */
export function TeamCertifications({ className = "" }: { className?: string }) {
  return (
    <p className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center text-sm text-slate-600 xl:gap-x-3 ${className}`}>
      <span className="inline-flex items-center gap-2 font-semibold text-navy-950 xl:mr-1">
        <BadgeCheck aria-hidden className="size-5 text-brand-700" />
        {highlight.label}:
      </span>
      {/* A "|" between issuers from xl, where the line fits on one row; below that the line wraps
          and a separator could start a row, so the wider gap alone separates them. */}
      {highlightGroups().map(({ issuer, items }, g) => (
        <span key={issuer}>
          {g > 0 && (
            <span aria-hidden className="mr-3 text-slate-300 max-xl:hidden">
              |
            </span>
          )}
          <span className="font-semibold text-brand-700">{issuer}:</span> <Codes items={items} />
        </span>
      ))}
      <Link
        to={highlight.more.href}
        className="inline-flex items-center gap-1 font-semibold text-navy-700 underline-offset-4 hover:text-navy-900 hover:underline xl:ml-3"
      >
        {highlight.more.label}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </p>
  );
}
