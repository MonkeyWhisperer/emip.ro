import type { MouseEvent } from "react";
import { Link } from "react-router";
import { features, intro, meta } from "../../content/functionalitati";
import { DemoButton } from "../../components/ui/DemoButton";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageMeta } from "../../components/ui/PageMeta";
import { ClosingCta } from "./ClosingCta";
import { FeatureRow } from "./FeatureRow";

/**
 * A router link only scrolls, so hand keyboard and screen-reader focus to the section heading
 * the way a native #anchor jump would (the next Tab then continues from that section).
 */
function focusHeading(event: MouseEvent, id: string) {
  // Leave clicks that open a new tab or window alone.
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  document.getElementById(id)?.querySelector<HTMLElement>("h2")?.focus({ preventScroll: true });
}

export function FunctionalitatiPage() {
  return (
    <>
      <PageMeta title={meta.title} description={meta.description} />
      <PageHeader
        eyebrow={intro.eyebrow}
        title={intro.title}
        text={intro.text}
        wide={
          // Router links (not plain #anchors) so every jump gets its own history entry and
          // ScrollRestoration can bring the reader back to the right spot on Back. The chips follow one
          // another across the page's full width (like the blog's categories), wrapping when needed.
          <nav aria-label={intro.navLabel} className="mt-2">
            <ul className="flex flex-wrap gap-2">
              {features.map(({ id, icon: Icon, title }) => (
                <li key={id}>
                  <Link
                    to={`#${id}`}
                    onClick={(event) => focusHeading(event, id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-400/60 hover:bg-white/10"
                  >
                    <Icon aria-hidden className="size-4 shrink-0 text-brand-400" />
                    {title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        }
      >
        <DemoButton href={intro.primary.href} arrow>
          {intro.primary.label}
        </DemoButton>
      </PageHeader>

      {features.map((feature, i) => (
        <FeatureRow key={feature.id} feature={feature} index={i} />
      ))}

      <ClosingCta />
    </>
  );
}
