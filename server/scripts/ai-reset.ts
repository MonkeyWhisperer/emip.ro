// Deletes the AI assistant's OpenAI vector store and uploaded files, and forgets them locally.
// Use it before switching OpenAI accounts/keys or to rebuild the knowledge base from scratch;
// the next site sync (automatic on production start) re-uploads the site content.
// Uploaded training files are removed too. Requires --force.
import OpenAI from "openai";
import { db, getMeta } from "../db.ts";
import { openai } from "../ai/knowledge.ts";

if (!process.argv.includes("--force")) {
  console.error("This deletes the assistant's knowledge base (vector store, site documents and uploaded training files). Re-run with --force.");
  process.exit(1);
}
if (!openai) {
  console.error("OPENAI_API_KEY is not set.");
  process.exit(1);
}

const ignoreMissing = (err: unknown) => {
  if (!(err instanceof OpenAI.NotFoundError)) throw err;
};
const files = db.prepare("SELECT openai_file_id FROM ai_sources WHERE openai_file_id IS NOT NULL").all() as { openai_file_id: string }[];
for (const f of files) await openai.files.delete(f.openai_file_id).catch(ignoreMissing);
const storeId = getMeta("ai_vector_store_id");
if (storeId) await openai.vectorStores.delete(storeId).catch(ignoreMissing);
db.exec("DELETE FROM ai_sources; DELETE FROM meta WHERE key IN ('ai_vector_store_id', 'ai_last_site_sync');");
console.log(`Deleted ${files.length} OpenAI files${storeId ? ` and vector store ${storeId}` : ""}.`);
