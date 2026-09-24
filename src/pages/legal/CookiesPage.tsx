import text from "../../content/legal/cookies.md?raw";
import { cookies } from "../../content/legal/legal";
import { LegalDocument } from "./LegalDocument";

export function CookiesPage() {
  return <LegalDocument doc={cookies} source={text} />;
}
