import { Link } from "react-router";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { contactPage } from "../../content/contact";
import { certificationCount, highlight } from "../../content/certificari";

const { team } = contactPage;

/** The people behind the inbox, and a link to the team's certifications (not per person). */
export function ContactTeam() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight">{team.title}</h2>
      {/* The photos share the card's full width, slightly overlapping (pl-3 offsets the first -ml-3). */}
      <ul className="mt-5 flex pl-3">
        {team.members.map((member) => (
          <li key={member.name} className="-ml-3 min-w-0 flex-1">
            <img
              src={member.photo}
              alt={member.name}
              title={member.name}
              width={320}
              height={320}
              loading="lazy"
              className="aspect-square w-full rounded-full bg-slate-100 object-cover ring-4 ring-white"
            />
          </li>
        ))}
      </ul>
      <Link
        to={highlight.more.href}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy-700 underline-offset-4 hover:text-navy-900 hover:underline"
      >
        <BadgeCheck aria-hidden className="size-5 text-brand-700" />
        {highlight.teamLink(certificationCount())}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </div>
  );
}
