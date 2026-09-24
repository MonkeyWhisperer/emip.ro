import text from "../../content/legal/confidentialitate.md?raw";
import { confidentialitate } from "../../content/legal/legal";
import { LegalDocument } from "./LegalDocument";

export function ConfidentialitatePage() {
  return <LegalDocument doc={confidentialitate} source={text} />;
}
