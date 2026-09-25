import { useRef, useState, type KeyboardEvent } from "react";
import { useLocation } from "react-router";
import { CircleCheck, Info } from "lucide-react";
import { intro, products, type PriceItem, type Product } from "../../content/preturi";
import { Section } from "../../components/ui/Section";

function PriceCard({ icon: Icon, title, price, text, note, stores }: PriceItem) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-navy-900/5">
      <div className="flex items-center gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-brand-400">
          <Icon aria-hidden className="size-5" />
        </div>
        <h4 className="text-lg font-semibold leading-snug">{title}</h4>
      </div>
      <p className="mt-4 flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-4xl font-extrabold tracking-tight text-navy-950">{price.amount}</span>
        <span className="text-sm font-semibold text-slate-500">{price.unit}</span>
      </p>
      <p className="mt-4 leading-relaxed text-slate-600">{text}</p>
      {note && (
        <div className="mt-auto pt-5">
          <p className="flex gap-2 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-500">
            <Info aria-hidden className="mt-1.25 size-4 shrink-0 text-brand-600" />
            {note}
          </p>
        </div>
      )}
      {stores && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-navy-950">{stores.title}</p>
          <ul className="mt-3 flex flex-wrap gap-3">
            {stores.links.map((store) => (
              <li key={store.href}>
                <a
                  href={store.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg transition-opacity hover:opacity-80"
                >
                  <img
                    src={store.image}
                    alt={store.label}
                    width={store.width}
                    height={store.height}
                    loading="lazy"
                    className="h-10 w-auto"
                  />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function ProductPanel({ product }: { product: Product }) {
  const { icon: Icon } = product;
  // When every group holds a single card (eMIP Plan Afaceri), the groups sit side by side instead of
  // each leaving a mostly empty row; the subgrid keeps the cards aligned when one group title wraps.
  const sideBySide = product.groups.every((group) => group.items.length === 1);
  return (
    <>
      <div className="flex items-start gap-4 sm:items-center sm:gap-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-navy-950 text-brand-400 sm:size-14">
          <Icon aria-hidden className="size-6 sm:size-7" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{product.name}</h2>
          <p className="mt-1 text-lg leading-relaxed text-slate-600">{product.text}</p>
        </div>
      </div>

      <div className={sideBySide ? "mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3" : undefined}>
        {product.groups.map((group) => (
          <div key={group.title} className={sideBySide ? "row-span-2 grid grid-rows-subgrid gap-y-6" : "mt-12"}>
            <h3 className="flex items-center gap-3 text-xl font-bold tracking-tight">
              <span
                aria-hidden
                className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-400 text-sm font-extrabold text-navy-950"
              >
                {group.letter}
              </span>
              <span>
                <span className="sr-only">{group.letter}. </span>
                {group.title}
              </span>
            </h3>
            <div className={sideBySide ? "grid" : "mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"}>
              {group.items.map((item) => (
                <PriceCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="relative isolate mt-12 overflow-hidden rounded-2xl bg-navy-950 p-6 sm:p-8">
        <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-72 rounded-full bg-brand-500/15 blur-3xl" />
        <h3 className="text-xl font-bold tracking-tight text-white">
          <span className="text-brand-400">{intro.advantagesLabel}</span> {product.name}
        </h3>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {product.advantages.map((advantage) => (
            <li key={advantage} className="flex gap-3 text-slate-200">
              <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-400" />
              {advantage}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const tabId = (id: string) => `tab-${id}`;

/** Accessible tabs (WAI-ARIA pattern, automatic activation). /preturi#arch opens a given product. */
export function ProductTabs() {
  const { hash } = useLocation();
  const [active, setActive] = useState(() => Math.max(0, products.findIndex((p) => `#${p.id}` === hash)));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (index: number) => {
    const next = (index + products.length) % products.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: products.length - 1,
    };
    if (event.key in keys) {
      event.preventDefault();
      select(keys[event.key]);
    }
  };

  return (
    <Section id="tarife" tone="muted">
      <div
        role="tablist"
        aria-label={intro.tabsLabel}
        className="grid grid-cols-3 gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm sm:inline-grid sm:gap-1.5"
      >
        {products.map((product, i) => {
          const selected = i === active;
          const { icon: Icon } = product;
          return (
            <button
              key={product.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(product.id)}
              aria-selected={selected}
              aria-controls={product.id}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-center text-sm font-semibold transition-colors sm:flex-row sm:gap-2 sm:px-5 sm:py-3 ${
                selected ? "bg-navy-950 text-white shadow-sm" : "text-navy-900 hover:bg-slate-100"
              }`}
            >
              <Icon aria-hidden className={`size-5 shrink-0 sm:size-4 ${selected ? "text-brand-400" : "text-brand-700"}`} />
              {/* Phones only have room for the product part of the name; screen readers still get it whole. */}
              <span>
                <span className="max-sm:sr-only">{intro.brand} </span>
                {product.short}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 text-sm text-slate-500">
        <Info aria-hidden className="mt-1 size-4 shrink-0" />
        {intro.vatNote}
      </p>

      {products.map((product, i) => (
        <div
          key={product.id}
          id={product.id}
          role="tabpanel"
          aria-labelledby={tabId(product.id)}
          hidden={i !== active}
          tabIndex={0}
          // Large scroll margin so /preturi#arch lands with the tabs (and sticky header) still in view.
          className="mt-10 scroll-mt-64 rounded-3xl focus-visible:outline-offset-8"
        >
          <ProductPanel product={product} />
        </div>
      ))}
    </Section>
  );
}
