import { z } from "zod";

export const DOMAINS = [
  "HTML",
  "BOOTSTRAP",
  "JAVASCRIPT",
  "MACHINE LEARNING",
  "OS BASICS",
  "CYBER SECURITY",
  "OTHERS",
] as const;

export type Domain = (typeof DOMAINS)[number];

const DOMAIN_KEYWORDS: Record<Exclude<Domain, "OTHERS">, string[]> = {
  HTML: ["<html", "<div", "<span", "<a ", "<img", "tag", "html", "dom", "anchor", "semantic"],
  BOOTSTRAP: ["bootstrap", "container-fluid", "col-md", "row", "navbar", "btn-primary", "card-body"],
  JAVASCRIPT: [
    "javascript", "js ", "function", "const ", "let ", "var ", "=>", "async", "await",
    "promise", "callback", "closure", "hoisting", "prototype", "es6", "node",
  ],
  "MACHINE LEARNING": [
    "machine learning", " ml ", "neural", "regression", "classifier", "classification",
    "training", "dataset", "tensor", "sklearn", "model", "supervised", "unsupervised",
    "gradient", "overfit",
  ],
  "OS BASICS": [
    "operating system", "kernel", "process", "thread", "scheduling", "deadlock",
    "semaphore", "paging", "virtual memory", "syscall", "mutex",
  ],
  "CYBER SECURITY": [
    "cyber", "security", "encryption", "decrypt", "hash", "xss", "sql injection",
    "csrf", "phishing", "firewall", "vulnerab", "owasp", "exploit", "cve",
  ],
};

export function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .trim();
}

export function autoCorrect(input: string): string {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ ?\n ?/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function detectDomain(text: string): Domain | null {
  const lower = ` ${text.toLowerCase()} `;
  let best: { domain: Domain; score: number } | null = null;
  for (const [domain, kws] of Object.entries(DOMAIN_KEYWORDS) as [Domain, string[]][]) {
    let score = 0;
    for (const kw of kws) if (lower.includes(kw)) score += 1;
    if (score > 0 && (!best || score > best.score)) best = { domain, score };
  }
  return best ? best.domain : null;
}

export const questionSchema = z.object({
  question: z.string().trim().min(5, "Question must be at least 5 characters").max(5000, "Question is too long"),
  domain: z.enum(DOMAINS),
  module: z.string().trim().max(120, "Module is too long").optional().default(""),
  screenshot_url: z.string().url().nullable().optional(),
});

export type QuestionInput = z.infer<typeof questionSchema>;
