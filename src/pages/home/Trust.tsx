import { trust, type TrustText } from "../../content/home";
import { Section, SectionHeader } from "../../components/ui/Section";
import { SmartLink } from "../../components/ui/SmartLink";

const badgeClass = "shrink-0 rounded-full bg-brand-400 px-3 py-1 text-xs font-semibold text-navy-950";

function Hint({ text }: { text?: string }) {
  return text ? <span className="sr-only"> ({text})</span> : null;
}

/** The badge in a card's top-right corner; a link to the proof (certificate, member list) when it has one. */
function Badge({ label, href, hint }: TrustText) {
  if (!href) return <span className={badgeClass}>{label}</span>;
  return (
    <SmartLink href={href} className={`${badgeClass} transition-colors hover:bg-brand-300`}>
      {label}
      <Hint text={hint} />
    </SmartLink>
  );
}

export function Trust() {
  return (
    <Section id="certificari" tone="muted">
      <SectionHeader eyebrow={trust.eyebrow} title={trust.title} text={trust.text} />

      {/* Each card spans four rows and shares them with the cards beside it (subgrid), so titles,
          subtitles and texts start at the same height across a row even when a title is one line. */}
      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {trust.items.map((item) => (
          <div
            key={item.subtitle}
            className="row-span-4 grid grid-rows-subgrid gap-0 rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-navy-900/5"
          >
            <div className="flex items-start justify-between gap-3">
              {/* The icon files are white line art; used as a mask, they take the title colour (the
                  system text colour in high-contrast mode, where backgrounds are otherwise replaced).
                  Smaller while four columns are narrow (lg), so the widest badge still fits beside it.
                  Inline styles aren't prefixed by the build, so the -webkit- mask is set here too. */}
              <span
                aria-hidden
                className="size-16 shrink-0 bg-navy-900 mask-contain mask-center mask-no-repeat forced-colors:bg-[CanvasText] forced-colors:forced-color-adjust-none lg:max-xl:size-12"
                style={{ maskImage: `url(${item.icon})`, WebkitMaskImage: `url(${item.icon})` }}
              />
              <Badge {...item.badge} />
            </div>
            <h3 className="mt-6 text-xl font-semibold leading-snug">
              {item.title.map(({ label, href, hint }: TrustText) => (
                <span key={label} className="block">
                  {href ? (
                    <SmartLink
                      href={href}
                      className="underline decoration-navy-200 underline-offset-4 transition-colors hover:text-brand-700 hover:decoration-current"
                    >
                      {label}
                      <Hint text={hint} />
                    </SmartLink>
                  ) : (
                    label
                  )}
                </span>
              ))}
            </h3>
            <p className="mt-2 font-medium text-brand-700">{item.subtitle}</p>
            <p className="mt-3 leading-relaxed text-slate-600">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Same columns and gap as the cards above, and each item inset like a card's content
          (1px border + 24px padding), so every label starts where the card text above starts. */}
      <ul className="mt-10 grid gap-x-6 gap-y-4 rounded-2xl bg-navy-950 py-6 sm:grid-cols-2 lg:grid-cols-4">
        {trust.guarantees.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 border-x border-transparent px-6 text-sm font-medium text-white">
            <Icon aria-hidden className="size-5 shrink-0 text-brand-400" />
            {label}
          </li>
        ))}
      </ul>
    </Section>
  );
}
