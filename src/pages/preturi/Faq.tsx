import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { ChevronDown } from "lucide-react";
import { faq } from "../../content/preturi";
import { Markdown } from "../../components/ui/Markdown";
import { Section, SectionHeader } from "../../components/ui/Section";

const questionId = (number: string) => `intrebare-${number.replace(".", "-")}`;

export function Faq() {
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const wixQuestion = params.get("questionId");

  // Old Wix links (/preturi?questionId=…) are rewritten to the question's own anchor (/preturi#intrebare-4-2).
  // The router's <ScrollRestoration> then scrolls to it; scrolling here instead would race with its restore.
  useEffect(() => {
    if (!wixQuestion) return;
    const item = faq.categories.flatMap((c) => c.items).find((q) => q.wixId === wixQuestion);
    if (item) navigate({ search: "", hash: questionId(item.number) }, { replace: true });
  }, [wixQuestion, navigate]);

  // A question anchor opens that answer (before <ScrollRestoration>, rendered later in the tree, scrolls to it).
  useLayoutEffect(() => {
    const el = hash ? document.getElementById(hash.slice(1)) : null;
    if (el instanceof HTMLDetailsElement) el.open = true;
  }, [hash]);

  return (
    <Section id="intrebari-frecvente" tone="muted">
      <div className="grid gap-12 lg:grid-cols-[18rem_1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeader eyebrow={faq.eyebrow} title={faq.title} align="left" />
          <nav aria-label={faq.navLabel} className="mt-8">
            <ol className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {faq.categories.map((category, i) => (
                <li key={category.id}>
                  <a
                    href={`#${category.id}`}
                    className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:border-navy-600 lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-3 lg:hover:border-slate-200 lg:hover:bg-white"
                  >
                    <span className="font-semibold tabular-nums text-brand-700">{i + 1}</span>
                    {category.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="space-y-12">
          {faq.categories.map((category, i) => (
            <div key={category.id} id={category.id} className="scroll-mt-24">
              <h3 className="flex items-center gap-3 text-xl font-bold tracking-tight">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-sm font-bold text-brand-400"
                >
                  {i + 1}
                </span>
                {category.title}
              </h3>
              <div className="mt-5 space-y-3">
                {category.items.map((item) => (
                  <details
                    key={item.number}
                    id={questionId(item.number)}
                    className="group scroll-mt-24 rounded-2xl border border-slate-200 bg-white open:shadow-lg open:shadow-navy-900/5"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-4 rounded-2xl px-5 py-4 font-semibold text-navy-950 sm:px-6 sm:py-5 [&::-webkit-details-marker]:hidden">
                      <span className="mt-0.5 shrink-0 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold tabular-nums text-brand-700">
                        {item.number}
                      </span>
                      <span className="flex-1">{item.question}</span>
                      <ChevronDown
                        aria-hidden
                        className="mt-0.5 size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <Markdown source={item.answer} className="border-t border-slate-100 px-5 pb-6 pt-2 sm:px-6" />
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
