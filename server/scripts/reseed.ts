// Wipes ALL posts and categories (including ones created in the admin panel) and
// re-imports the migrated Wix posts from server/seed/. Requires --force.
import { db } from "../db.ts";
import { seed } from "../seed.ts";

if (!process.argv.includes("--force")) {
  console.error("This deletes every post and category in the database. Re-run with --force to continue.");
  process.exit(1);
}
db.exec("DELETE FROM posts; DELETE FROM categories; DELETE FROM meta WHERE key = 'seeded';");
const result = seed();
console.log(`Re-imported ${result.posts} posts and ${result.categories} categories.`);
