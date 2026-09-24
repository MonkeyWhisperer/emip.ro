import type { ReactNode } from "react";
import { Container } from "./Section";

type Props = {
  eyebrow?: string;
  title: string;
  text?: string;
  /** Extra content under the text, e.g. buttons or filter chips. */
  children?: ReactNode;
};

/** Dark banner at the top of every inner page, matching the home hero. */
export function PageHeader({ eyebrow, title, text, children }: Props) {
  return (
    <section className="relative isolate overflow-hidden bg-navy-950">
      <div
        aria-hidden
        className="absolute -right-32 -top-32 -z-10 size-[28rem] rounded-full bg-brand-500/10 blur-3xl"
      />
      <div aria-hidden className="absolute -bottom-40 -left-20 -z-10 size-96 rounded-full bg-navy-600/30 blur-3xl" />
      <Container className="py-16 sm:py-20">
        <div className="max-w-3xl animate-fade-up">
          {eyebrow && (
            <p className="text-sm font-semibold uppercase tracking-wider text-brand-400">{eyebrow}</p>
          )}
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
          {text && <p className="mt-5 text-lg leading-relaxed text-slate-300">{text}</p>}
          {children && <div className="mt-8">{children}</div>}
        </div>
      </Container>
    </section>
  );
}
