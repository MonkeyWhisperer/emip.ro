import { ExternalLink } from "lucide-react";
import { contactPage } from "../../content/contact";
import { SmartLink } from "../../components/ui/SmartLink";

const { details } = contactPage;

/** Dark card with email, phone, address and working hours. */
export function ContactDetails() {
  return (
    <div className="relative isolate overflow-hidden rounded-2xl bg-navy-950 p-6 text-slate-300 sm:p-8">
      <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-500/15 blur-3xl" />
      <h2 className="text-2xl font-bold tracking-tight text-white">{details.title}</h2>

      <ul className="mt-8 space-y-7">
        {details.items.map(({ icon: Icon, label, lines, href, extra }) => (
          <li key={label} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-brand-400">
              <Icon aria-hidden className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-400">{label}</p>
              {lines.map((line, i) =>
                i === 0 && href ? (
                  <a
                    key={line}
                    href={href}
                    className="mt-1 block break-words font-semibold text-white transition-colors hover:text-brand-300"
                  >
                    {line}
                  </a>
                ) : (
                  <p key={line} className={`font-semibold text-white ${i === 0 ? "mt-1" : ""}`}>
                    {line}
                  </p>
                ),
              )}
              {extra && (
                <SmartLink
                  href={extra.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
                >
                  {extra.label}
                  <ExternalLink aria-hidden className="size-3.5" />
                  <span className="sr-only"> (se deschide într-o filă nouă)</span>
                </SmartLink>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
