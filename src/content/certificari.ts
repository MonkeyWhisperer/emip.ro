// The team's personal certifications (/certificari and the "Echipă certificată" line on the home
// page). The holders agreed to them being listed; no names are shown. Data and documents come from
// the Vazduh site's certifications page (the PDFs are copies in public/docs/certificari/); the
// Microsoft list, names and dates follow the Microsoft Learn transcript
// (https://learn.microsoft.com/api/profiles/transcript/share/71pwybw4yywyoxk). The CompTIA
// certifications and the Microsoft ones linked to Credly come from a second team member's Credly
// profile (https://www.credly.com/users/dan-iurai-pisec/badges.json).
//
// Dates are YYYY-MM-DD; cards show neither dates nor numbers. A certification whose `expires` date has
// passed is hidden automatically (see activeIssuers); after a renewal, update `expires` and it
// shows again. The Credly certifications are listed by issue date without `expires`, as the owner
// asked, so they always show (on Credly the CompTIA ones ran to 16.05.2026, the Azure ones to 2023).

export type Certification = {
  code: string;
  title: string;
  /** Area and level, parts separated by " · " (not shown on the page; for grouping and reference). */
  scope: string;
  /** Credential or certificate number (not shown on the page; for offers and verification requests). */
  number?: string;
  issued: string;
  /** Last day of validity; none for certificates that do not expire. */
  expires?: string;
  /** The certificate itself: the issuer's verification page or a PDF. */
  href?: string;
  /** Label on the home page's "Echipă certificată" line; only certifications with one appear there. */
  line?: string;
  /** A Microsoft Applied Skill: counted apart from the certifications. */
  appliedSkill?: true;
};

export type Issuer = {
  id: string;
  name: string;
  full: string;
  /** A function gets the issuer's listed certifications, for texts with counts. */
  text: string | ((listed: Certification[]) => string);
  items: Certification[];
};

const MS_SHARE = "https://learn.microsoft.com/api/credentials/share/en-us/Alexandru-Rusan";
const ms = (id: string) => `${MS_SHARE}/${id}?sharingId=FC4E47E591F5884`;
const DOCS = "/docs/certificari";
const credly = (id: string) => `https://www.credly.com/badges/${id}`;

/** "1 certificare", "6 certificări", "41 de certificări" (Romanian takes "de" from 20 up, except …01–…19). */
const certificari = (n: number) => (n === 1 ? "1 certificare" : n % 100 >= 20 || n % 100 === 0 ? `${n} de certificări` : `${n} certificări`);

export const meta = {
  title: "Certificări",
  description:
    "Certificările echipei eMIP: audit IT și securitate cibernetică (ISACA, DNSC, CompTIA), cloud, AI și date (Microsoft), cu link de verificare pentru fiecare.",
};

export const intro = {
  eyebrow: "Certificări",
  title: "Echipă certificată",
  text: "Certificările internaționale și naționale ale echipei eMIP, în audit, securitate cibernetică, cloud, inteligență artificială și date. Fiecare are document sau link de verificare la emitent.",
  all: "Toate",
  filterLabel: "Filtrează după emitent",
  view: "Vezi",
  count: certificari,
};

export const issuers: Issuer[] = [
  {
    id: "isaca",
    name: "ISACA",
    full: "Information Systems Audit and Control Association",
    text: "Cele mai recunoscute certificări internaționale în audit IT, securitate informațională, risc și guvernanță. Acreditate ANSI/ISO/IEC 17024; CISA și CISM sunt aprobate de US DoD 8140.",
    items: [
      { code: "CISA", title: "Certified Information Systems Auditor", scope: "Audit", number: "262978755", issued: "2026-01-09", expires: "2030-01-31", href: "https://www.credly.com/badges/709d6852-3080-4c41-bdcf-cf4234cd184c/public_url", line: "CISA" },
      { code: "CISM", title: "Certified Information Security Manager", scope: "Management securitate", number: "252925814", issued: "2025-10-17", expires: "2029-01-31", href: "https://www.credly.com/badges/8ec8ed2a-534e-405f-867e-54435fc84c66/public_url", line: "CISM" },
      { code: "CRISC", title: "Certified in Risk and Information Systems Control", scope: "Risc", number: "262983484", issued: "2026-01-16", expires: "2030-01-31", href: "https://www.credly.com/badges/0c004816-effc-4b2a-bf1f-fc20d54b0025/public_url", line: "CRISC" },
      { code: "CGEIT", title: "Certified in the Governance of Enterprise IT", scope: "Guvernanță IT", number: "262983494", issued: "2026-01-16", expires: "2030-01-31", href: "https://www.credly.com/badges/ca427742-51fd-4e53-9c18-1946897a11dd/public_url" },
      { code: "CDPSE", title: "Certified Data Privacy Solutions Engineer", scope: "Confidențialitate", number: "262983496", issued: "2026-01-16", expires: "2030-01-31", href: "https://www.credly.com/badges/8c85881d-4a15-442e-b1da-ba71fce1f86c/public_url", line: "CDPSE" },
      { code: "AAIA", title: "Advanced in AI Audit", scope: "Audit AI", number: "263017041", issued: "2026-02-20", expires: "2030-01-31", href: "https://www.credly.com/badges/124ddce8-a76e-4903-9ca2-6c32a4783d35/public_url", line: "AAIA" },
    ],
  },
  {
    id: "dnsc",
    name: "DNSC",
    full: "Directoratul Național de Securitate Cibernetică",
    text: "Atestare și specializare oficiale, recunoscute la nivel național conform Legii 362/2018.",
    items: [
      // The holder's own attestation (not the company's).
      { code: "AASC", title: "Atestat Auditor de Securitate Cibernetică · Tip General", scope: "Atestat oficial", number: "CIE 26025 · IDASC QC-F6DF5", issued: "2026-05-06", expires: "2029-05-05", href: `${DOCS}/dnsc-atestat-auditor.pdf`, line: "Auditor atestat" },
      { code: "CSSC", title: "Certificat de specializare pentru securitate cibernetică", scope: "Specializare", issued: "2025-08-07", href: `${DOCS}/dnsc-certificat-specializare.pdf` },
    ],
  },
  {
    id: "microsoft",
    name: "Microsoft",
    full: "Microsoft Learn · Certificări și competențe aplicate",
    text: (listed) => {
      const skills = listed.filter((c) => c.appliedSkill).length;
      return `${certificari(listed.length - skills)} și ${skills} competențe aplicate (Applied Skills) pe securitate, cloud, inteligență artificială, date și Power Platform.`;
    },
    // Certifications by area, then Applied Skills, then the 2018 generation (newest first). MCT is
    // not on the transcript (a separate program) and is one card for the team's years as trainers;
    // AZ-500, SC-200 and DP-203 are on the transcript as expired. The entries linked to Credly are
    // the second team member's.
    items: [
      { code: "MCT", title: "Microsoft Certified Trainer din 2018", scope: "Formator", issued: "2018-04-13", line: "MCT", href: "https://prod.mct.pvue2.com/assets/certificate.html?token=5BSqlSSNXbdt4HpQ53cG0wx7YFSuYGzXvfv8ExfmPps&url=https://prod-back.mct.pvue2.com" },
      { code: "SC-100", title: "Cybersecurity Architect Expert", scope: "Securitate · Expert", number: "DFEA85-839670", issued: "2024-06-10", expires: "2027-06-10", href: ms("C87826C18E424E4C"), line: "SC-100" },
      { code: "AZ-500", title: "Azure Security Engineer Associate", scope: "Securitate", number: "D4AD3B-ABCAE4", issued: "2023-09-08", expires: "2026-09-08", href: ms("CEEA33804D9B7329") },
      { code: "SC-200", title: "Security Operations Analyst Associate", scope: "Operațiuni de securitate", number: "246225-FEB490", issued: "2023-09-14", expires: "2026-09-14", href: ms("6AE03E5F4BFEB4B2") },
      { code: "AZ-305", title: "Azure Solutions Architect Expert", scope: "Arhitectură · Expert", number: "B9P6A8-0E5F48", issued: "2022-05-12", expires: "2027-05-12", href: ms("47BC2F59F0138977"), line: "AZ-305" },
      { code: "AZ-400", title: "DevOps Engineer Expert", scope: "DevOps · Expert", number: "BF20B4-8E2326", issued: "2022-04-19", expires: "2027-04-19", href: ms("ABED4C007278526"), line: "AZ-400" },
      { code: "AZ-104", title: "Azure Administrator Associate", scope: "Administrare cloud", number: "5BBCEQ-92899D", issued: "2022-05-02", expires: "2027-05-02", href: ms("9B2F50F8BC5EBE6") },
      { code: "AZ-204", title: "Azure Developer Associate", scope: "Dezvoltare", number: "LD5BCA-F41D06", issued: "2021-10-01", expires: "2026-10-01", href: ms("3439F1A56145FD3D") },
      { code: "AB-100", title: "Agentic AI Business Solutions Architect Expert", scope: "AI · Arhitect", number: "6D4129-BM9715", issued: "2026-03-08", expires: "2027-03-08", href: ms("5835790BD2E3E32"), line: "AB-100" },
      { code: "AB-731", title: "AI Transformation Leader", scope: "AI · Management", number: "427E07-3ABI2C", issued: "2026-03-05", href: ms("60F40117BD3F6EC8") },
      { code: "AB-730", title: "AI Business Professional", scope: "AI · Afaceri", number: "0D41AP-5F4273", issued: "2026-02-26", href: ms("B9CF2B3620AB4A78") },
      { code: "AI-102", title: "Azure AI Engineer Associate", scope: "AI", number: "XE505D-54CBB0", issued: "2021-08-30", expires: "2027-08-30", href: ms("16B89E249BD199AD") },
      { code: "AI-900", title: "Azure AI Fundamentals", scope: "AI · Fundamente", number: "FC3B68-38D928", issued: "2021-08-28", href: ms("56A4090808F4E873") },
      { code: "DP-420", title: "Azure Cosmos DB Developer Specialty", scope: "Date · Specializare", number: "D5F234-0I794E", issued: "2022-06-02", expires: "2027-06-02", href: ms("30B04DF7A8A7EDD8") },
      { code: "DP-300", title: "Azure Database Administrator Associate", scope: "Date", number: "94ABA7-1EEDE4", issued: "2021-07-22", expires: "2027-07-22", href: ms("577B46C562DE1283") },
      { code: "DP-300", title: "Azure Database Administrator Associate", scope: "Date", issued: "2021-09-01", href: credly("70ed604d-a67c-4110-8873-14c83cd1bb1e") },
      { code: "DP-203", title: "Azure Data Engineer Associate", scope: "Inginerie de date", number: "BZ03FD-C98265", issued: "2021-08-27", expires: "2026-08-27" },
      { code: "DP-203", title: "Azure Data Engineer Associate", scope: "Inginerie de date", issued: "2021-10-08", href: credly("2eaceee7-570b-4698-a540-1f0fa093c181") },
      { code: "DP-900", title: "Azure Data Fundamentals", scope: "Date · Fundamente", number: "8K074A-196DDF", issued: "2021-07-05", href: ms("D6C443D262EA5E2C") },
      { code: "PL-600", title: "Power Platform Solution Architect Expert", scope: "Power Platform · Expert", number: "CBC1C6-RF5C51", issued: "2026-01-14", expires: "2027-01-14", href: ms("EDBE479E08A7B9A1") },
      { code: "PL-200", title: "Power Platform Functional Consultant Associate", scope: "Power Platform", number: "039165-458V5B", issued: "2026-01-14", expires: "2027-01-14", href: ms("76E8A765DA459719") },
      { code: "PL-300", title: "Power BI Data Analyst Associate", scope: "Date · Analiză", number: "8AAAE6-IC5B47", issued: "2026-01-13", expires: "2027-01-13", href: "https://learn.microsoft.com/en-us/users/alexandru-rusan/credentials/certification/data-analyst-associate?tab=credentials-tab" },
      { code: "PL-900", title: "Power Platform Fundamentals", scope: "Power Platform · Fundamente", number: "5D3DD9-41HA41", issued: "2026-01-12", href: ms("A4B71C049ACA1515") },

      { code: "AS · ADDS", title: "Applied Skill · Administer Active Directory Domain Services", scope: "Identitate · Competență aplicată", number: "9B5A36E698646D59", issued: "2026-01-25", href: ms("9B5A36E698646D59"), appliedSkill: true },
      { code: "AS · KMine", title: "Applied Skill · Implement knowledge mining with Azure AI Search", scope: "AI · Competență aplicată", number: "1DE787671DF298DF", issued: "2026-01-24", href: ms("1DE787671DF298DF"), appliedSkill: true },
      { code: "AS · GenAI", title: "Applied Skill · Develop a Generative AI Chat App Using the Microsoft Foundry SDK", scope: "AI · Competență aplicată", number: "5EC46CA59DA35450", issued: "2026-01-24", href: ms("5EC46CA59DA35450"), appliedSkill: true },
      { code: "AS · MDApps", title: "Applied Skill · Create and manage model-driven apps with Power Apps and Dataverse", scope: "Power Platform · Competență aplicată", number: "B55ADED5FC27A274", issued: "2026-01-13", href: ms("B55ADED5FC27A274"), appliedSkill: true },
      { code: "AS · Auto", title: "Applied Skill · Create and manage automated processes by using Power Automate", scope: "Power Platform · Competență aplicată", number: "F3F12A70F20A61E0", issued: "2026-01-12", href: ms("F3F12A70F20A61E0"), appliedSkill: true },
      { code: "AS · DocAI", title: "Applied Skill · Create an intelligent document processing solution with Azure AI Document Intelligence", scope: "AI · Competență aplicată", number: "44347C3F2D43750D", issued: "2024-04-25", href: ms("44347C3F2D43750D"), appliedSkill: true },
      { code: "AS · NLP", title: "Applied Skill · Build a natural language processing solution with Azure AI Language", scope: "AI · Competență aplicată", number: "2A904EB126C69870", issued: "2024-03-21", href: ms("2A904EB126C69870"), appliedSkill: true },
      { code: "AS · Vision", title: "Applied Skill · Build an Azure AI Vision solution", scope: "AI · Competență aplicată", number: "E2365CB30EF4D5B7", issued: "2024-03-20", href: ms("E2365CB30EF4D5B7"), appliedSkill: true },

      { code: "MCSE BA", title: "MCSE: Business Applications", scope: "Expert · Generația 2018", number: "AD4D9C-FU5AE3", issued: "2018-12-11", href: credly("bb942e2d-479e-4e56-bfd4-70f29c92a7a0") },
      { code: "MCSA ML", title: "MCSA: Machine Learning", scope: "Generația 2018", number: "3W58CE-F46A10", issued: "2018-04-27", href: credly("96e96f24-822d-42b2-a869-393d60e48288") },
      { code: "MCSA D365", title: "MCSA: Dynamics 365", scope: "Generația 2018", number: "0A2BA9-017I49", issued: "2018-04-25", href: credly("f39529cc-176c-4bff-b25b-9b891e816bf1") },
      { code: "MCSE DA", title: "MCSE: Data Management and Analytics", scope: "Expert · Generația 2018", number: "16E699-8S2E44", issued: "2018-04-24", href: credly("01f0ab2c-f3d1-4e43-b30b-76bc1bb1cd3a") },
      { code: "MCSA W10", title: "MCSA: Windows 10", scope: "Generația 2018", number: "2C4B37-BA80Y6", issued: "2018-04-05", href: credly("b2443cfe-7935-41c4-ba71-3ea61326ca8f") },
      { code: "MCSE PSE", title: "MCSE: Productivity Solutions Expert", scope: "Expert · Generația 2018", number: "871416-R5FD5B", issued: "2018-04-04", href: credly("3d1cfaee-5e2e-4875-a37e-0deaa99f08b6") },
      { code: "MCSA CP", title: "MCSA: Cloud Platform", scope: "Generația 2018", number: "MF123F-FC5400", issued: "2018-03-17", href: credly("ef48283d-121b-47ba-9699-03e7123ba18c") },
      { code: "MCSE CPI", title: "MCSE: Cloud Platform and Infrastructure", scope: "Expert · Generația 2018", number: "D5SC1A-3E5DC4", issued: "2018-03-15", href: credly("7d828c9f-21dd-450a-ab54-351fdc74fef3") },
      { code: "MCSA WS16", title: "MCSA: Windows Server 2016", scope: "Generația 2018", number: "252A8B-6597FD", issued: "2018-03-15", href: credly("ebcbe6e1-f9cf-445c-9d07-fa788e75a209") },
      { code: "MCSA WS12", title: "MCSA: Windows Server 2012", scope: "Generația 2018", number: "DD3AE9-99AA13", issued: "2018-03-15", href: credly("b2942845-4866-4cc6-8c3e-eb6903939257") },
      { code: "MCSA UWP", title: "MCSA: Universal Windows Platform", scope: "Generația 2018", number: "C09E5R-050C79", issued: "2018-03-08", href: credly("816eb58f-4883-4690-8d40-8c9ed5616e0b") },
      { code: "MCSA WEB", title: "MCSA: Web Applications", scope: "Generația 2018", number: "EY5B66-3FB3E8", issued: "2018-02-24", href: credly("f9fd9df9-55d3-4d92-a186-c5fe079bc4f9") },
      { code: "MCSD", title: "MCSD: App Builder", scope: "Dezvoltare · Generația 2018", number: "BA39F1-3134QC", issued: "2018-02-24", href: credly("de34b536-69fa-4874-96f5-93ede5b8a42e") },
      { code: "MTA Cloud", title: "MTA: Cloud Fundamentals", scope: "Fundamente · Generația 2018", number: "GDAA59-450FFE", issued: "2018-02-23", href: credly("2a38736e-3cfb-460e-a1a7-386111abf778") },
      { code: "MTA Mob", title: "MTA: Mobility and Device Fundamentals", scope: "Fundamente · Generația 2018", number: "7BDECF-ABC44H", issued: "2018-02-23", href: credly("41e2c2d1-2c21-4fa5-bb26-3b536851e636") },
      { code: "MTA Sec", title: "MTA: Security Fundamentals", scope: "Fundamente · Generația 2018", number: "4S7244-782658", issued: "2018-02-22", href: credly("111e3578-2e1c-4ffb-a0f7-74c515d29078") },
      { code: "MTA Dev", title: "MTA: Software Development Fundamentals", scope: "Fundamente · Generația 2018", number: "522E97-A3M9A6", issued: "2018-02-22", href: credly("727bebab-187c-47e1-a3f7-d51b1b4cd397") },
      { code: "MCSA SQL", title: "MCSA: SQL 2016 Database Development", scope: "Date · Generația 2018", number: "D1A442-7312EF", issued: "2018-02-15", href: credly("c59d24e8-b15c-4f81-b197-f549229be51c") },
      { code: "MTA DB", title: "MTA: Database Fundamentals", scope: "Fundamente · Generația 2018", number: "306493-F4702D", issued: "2018-02-03", href: credly("bfc57e1e-cf8e-419a-a8a0-912418c0633e") },
    ],
  },
  {
    id: "comptia",
    name: "CompTIA",
    full: "Computing Technology Industry Association",
    text: "Certificări internaționale, independente de furnizor, pentru securitate cibernetică, rețele și suport IT, plus certificările de specialist obținute prin combinarea lor.",
    items: [
      { code: "SecurityX", title: "CompTIA SecurityX ce (examenul CAS-004)", scope: "Securitate · Expert", issued: "2023-05-16", href: credly("2fd9dfe7-c61e-4ebb-a68a-7725d64fb18f") },
      { code: "CSIS", title: "CompTIA Secure Infrastructure Specialist", scope: "Securitate · Specialist", issued: "2020-06-18", href: credly("54576679-d368-47d0-b37f-0032ada86c9b") },
      { code: "Security+", title: "CompTIA Security+ ce", scope: "Securitate", issued: "2020-06-18", href: credly("2f25133d-28b8-40ba-946d-579086f7fd00") },
      { code: "CIOS", title: "CompTIA IT Operations Specialist", scope: "Operațiuni IT · Specialist", issued: "2020-04-23", href: credly("f24339ec-90ad-465f-8244-533c0f707172") },
      { code: "Network+", title: "CompTIA Network+ ce", scope: "Rețele", issued: "2020-04-23", href: credly("28880074-cf70-4aab-93b2-5606a165302a") },
      { code: "A+", title: "CompTIA A+ ce", scope: "Suport IT", issued: "2020-03-05", href: credly("05867691-7b68-4b57-b1b3-10cddbdf5703") },
    ],
  },
  {
    id: "mile2",
    name: "Mile2",
    full: "Mile2 Cybersecurity Certifications",
    text: "Certificare de penetration testing recunoscută de NSA / CNSS / FBI și mapată pe NIST / NICCS.",
    items: [
      { code: "C)PTC", title: "Certified Penetration Testing Consultant", scope: "Securitate ofensivă", number: "29503-176-641-7153", issued: "2025-12-22", expires: "2028-12-21", href: `${DOCS}/mile2-cptc.pdf` },
    ],
  },
  {
    id: "gaqm",
    name: "GAQM",
    full: "Global Association for Quality Management",
    text: "Certificare internațională de penetration testing, susținută sub supraveghere (proctored).",
    items: [{ code: "CPT", title: "Certified Penetration Tester", scope: "Testare de penetrare", number: "G-110771", issued: "2025-12-20", href: `${DOCS}/gaqm-cpt.pdf` }],
  },
  {
    id: "adr",
    name: "ADR · PNRR",
    full: "Autoritatea pentru Digitalizarea României",
    text: "Cursuri oficiale finanțate prin PNRR / NextGenerationEU pe tehnologii emergente.",
    items: [
      { code: "AI", title: "Inteligență artificială", scope: "AI", number: "C68C2D8EC3", issued: "2025-09-11", href: `${DOCS}/adr-inteligenta-artificiala.pdf` },
      { code: "ML", title: "Machine Learning", scope: "Învățare automată", number: "C68DC0A584", issued: "2025-09-30", href: `${DOCS}/adr-machine-learning.pdf` },
      { code: "BD", title: "Big Data", scope: "Date", number: "C689B31A8E", issued: "2025-08-12", href: `${DOCS}/adr-big-data.pdf` },
      { code: "BC", title: "Blockchain", scope: "Blockchain", number: "C69280C042", issued: "2025-11-27", href: `${DOCS}/adr-blockchain.pdf` },
      { code: "IoT", title: "Internet of Things", scope: "IoT", number: "C68C1595CA", issued: "2025-09-10", href: `${DOCS}/adr-internet-of-things.pdf` },
      { code: "CPSA", title: "Cyber-Physical Systems Audit", scope: "OT / ICS", number: "C68E12E906", issued: "2025-10-04", href: `${DOCS}/adr-cyber-physical-systems-audit.pdf` },
    ],
  },
];

/** The home page's summary line (components/ui/TeamCertifications) and the contact page's link. */
export const highlight = {
  label: "Echipă certificată",
  more: { label: "Toate certificările", href: "/certificari" },
  /** "Vezi cele 70 de certificări ale echipei" (the contact page's team card). */
  teamLink: (n: number) => (n === 1 ? "Vezi certificarea echipei" : `Vezi cele ${certificari(n)} ale echipei`),
};

/** How many certifications /certificari lists (valid ones, all issuers). */
export const certificationCount = (day = today()) => activeIssuers(day).reduce((n, i) => n + i.items.length, 0);

/** Valid certifications marked `line`, grouped by issuer, for the summary. */
export function highlightGroups(day = today()) {
  return activeIssuers(day)
    .map((i) => ({ issuer: i.name, items: i.items.flatMap((c) => (c.line ? [{ line: c.line, title: c.title }] : [])) }))
    .filter((g) => g.items.length > 0);
}

/** Today as YYYY-MM-DD (UTC, like the dates above). */
const today = () => new Date().toISOString().slice(0, 10);

/** Valid today: no expiry date, or one not yet passed (the expiry day itself still counts). */
export const isActive = (c: Certification, day = today()) => !c.expires || c.expires >= day;

/** Issuers with only their active certifications; issuers left with none are dropped. */
export function activeIssuers(day = today()): Issuer[] {
  return issuers.map((i) => ({ ...i, items: i.items.filter((c) => isActive(c, day)) })).filter((i) => i.items.length > 0);
}
