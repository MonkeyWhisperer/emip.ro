export { foldSlug } from "../../shared/blog";

// Dates are stored as YYYY-MM-DD, which Date parses as UTC midnight; format in UTC too,
// otherwise visitors west of UTC see the previous day.
const dateFormat = new Intl.DateTimeFormat("ro-RO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const formatDate = (iso: string) => dateFormat.format(new Date(iso));
