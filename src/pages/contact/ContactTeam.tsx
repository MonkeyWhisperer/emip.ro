import { MailCheck } from "lucide-react";
import { contactPage } from "../../content/contact";

const { team } = contactPage;

/** The people behind the inbox, with the response-time promise. */
export function ContactTeam() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <h2 className="text-xl font-bold tracking-tight">{team.title}</h2>
      {/* Sized so all seven fit on one row from 320px up, including the narrow lg column. */}
      <ul className="mt-5 flex flex-wrap pl-3">
        {team.members.map((member) => (
          <li key={member.name} className="-ml-3">
            <img
              src={member.photo}
              alt={member.name}
              title={member.name}
              width={320}
              height={320}
              loading="lazy"
              className="size-11 rounded-full bg-slate-100 object-cover ring-4 ring-white sm:size-14 lg:size-12 xl:size-14"
            />
          </li>
        ))}
      </ul>
      <p className="mt-6 flex gap-3 border-t border-slate-200 pt-5 text-slate-600">
        <MailCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-brand-700" />
        {team.note}
      </p>
    </div>
  );
}
