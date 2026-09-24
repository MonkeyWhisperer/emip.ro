import { product } from "../../content/solutii";
import { Section } from "../../components/ui/Section";

/** Splits the intro text around the highlighted word so it can be set in bold. */
function HighlightedText({ text, highlight }: { text: string; highlight: string }) {
  const at = text.indexOf(highlight);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <strong className="font-semibold text-navy-950">{highlight}</strong>
      {text.slice(at + highlight.length)}
    </>
  );
}

export function ProductIntro() {
  return (
    <Section id="emip-proiecte">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="block text-4xl font-extrabold text-brand-700 sm:text-5xl">{product.brand}</span>{" "}
            <span className="mt-2 block">{product.name}</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            <HighlightedText text={product.text} highlight={product.highlight} />
          </p>
        </div>

        <div className="rounded-[2rem] bg-gradient-to-br from-brand-100 via-navy-50 to-navy-100 p-3 sm:p-4">
          <img
            src={product.image.src}
            alt={product.image.alt}
            width={1600}
            height={893}
            className="aspect-[16/9] w-full rounded-3xl object-cover shadow-xl shadow-navy-900/10"
          />
        </div>
      </div>
    </Section>
  );
}
