import type { ComponentProps } from "react";
import { DEMO_NOTE } from "../../content/site";
import { ButtonLink } from "./ButtonLink";

type Props = ComponentProps<typeof ButtonLink> & {
  /** Defaults to DEMO_NOTE; eMIP Arch has its own ("Cu arhive demo virtualizate."). */
  note?: string;
};

/**
 * An "Accesează cont demo" button with its note directly underneath. In a row of buttons, give the
 * row `sm:items-start`, so the other buttons line up with this one rather than with the note.
 * The note's colour follows the button: the dark and outline buttons sit on light backgrounds.
 */
export function DemoButton({ note = DEMO_NOTE, ...button }: Props) {
  const onLight = button.variant === "dark" || button.variant === "outline";
  return (
    <div className="inline-flex flex-col gap-2">
      <ButtonLink {...button} />
      <p className={`text-center text-xs ${onLight ? "text-slate-500" : "text-slate-300"}`}>{note}</p>
    </div>
  );
}
