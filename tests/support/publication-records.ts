import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// The build remains the authority for schema and permission validation. Browser
// expectations use source records, never links discovered on the tested page.
function reviewedSlugs(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith(".json"))
    .map((name) => {
      const slug = name.slice(0, -5);
      const record = JSON.parse(readFileSync(join(directory, name), "utf8"));
      if (record.slug !== slug || record.publicationApproved !== true) {
        throw new Error(`Unreviewed publication record: ${name}`);
      }
      return slug;
    })
    .sort((a, b) => a.localeCompare(b));
}

export const publishedServiceSlugs = () => reviewedSlugs("src/content/services");
export const publishedStorySlugs = () => reviewedSlugs("src/content/stories");
