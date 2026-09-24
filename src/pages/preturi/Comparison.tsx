import { comparison, products } from "../../content/preturi";
import { Section, SectionHeader } from "../../components/ui/Section";

function NotApplicable() {
  return (
    <>
      <span aria-hidden className="text-slate-300">
        —
      </span>
      <span className="sr-only">{comparison.notApplicable}</span>
    </>
  );
}

export function Comparison() {
  return (
    <Section id="comparatie">
      <SectionHeader eyebrow={comparison.eyebrow} title={comparison.title} />

      {/* Desktop: full table */}
      <div className="mt-14 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-950 text-white">
            <tr>
              <th scope="col" className="px-5 py-4 font-semibold">
                {comparison.componentLabel}
              </th>
              {products.map((p) => (
                <th key={p.id} scope="col" className="px-5 py-4 font-semibold">
                  {p.name}
                </th>
              ))}
              <th scope="col" className="px-5 py-4 font-semibold">
                {comparison.descriptionLabel}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {comparison.rows.map((row) => (
              <tr key={row.component} className="even:bg-slate-50">
                <th scope="row" className="px-5 py-4 font-semibold text-navy-950">
                  {row.component}
                </th>
                {row.values.map((value, i) => (
                  <td key={products[i].id} className="whitespace-nowrap px-5 py-4 font-medium text-navy-900">
                    {value ?? <NotApplicable />}
                  </td>
                ))}
                <td className="px-5 py-4 leading-relaxed text-slate-600">{row.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile and tablet: one card per component, listing only the products it applies to */}
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:hidden">
        {comparison.rows.map((row) => (
          <li key={row.component} className="rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold">{row.component}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{row.description}</p>
            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
              {row.values.map((value, i) =>
                value ? (
                  <div key={products[i].id} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-slate-500">{products[i].name}</dt>
                    <dd className="text-right font-semibold text-navy-950">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
          </li>
        ))}
      </ul>
    </Section>
  );
}
