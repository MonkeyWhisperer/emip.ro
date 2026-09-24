import text from "../../content/legal/termeni.md?raw";
import { termeni } from "../../content/legal/legal";
import { LegalDocument } from "./LegalDocument";

export function TermeniPage() {
  return <LegalDocument doc={termeni} source={text} />;
}
