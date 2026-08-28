import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

type Json = { [key: string]: Json | string | number | boolean | Json[] };

function repoPath(relative: string): string {
  return join(process.cwd(), relative);
}

function readJson(relative: string): Json {
  return JSON.parse(readFileSync(repoPath(relative), "utf8")) as Json;
}

// Flattens a nested message catalog into dotted leaf key paths, e.g.
// { contact: { form: { name: "..." } } } -> "contact.form.name".
function flattenKeys(value: Json, prefix: string): string[] {
  if (Array.isArray(value) || typeof value !== "object" || value === null) {
    return [prefix];
  }
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child as Json, prefix ? `${prefix}.${key}` : key)
  );
}

// Collects every leaf value (string, number or boolean) keyed by its dotted
// path, the same shape flattenKeys walks but keeping the value instead of
// discarding it.
function flattenLeaves(
  value: Json,
  prefix: string,
  out: Map<string, Json>
): void {
  if (Array.isArray(value) || typeof value !== "object" || value === null) {
    out.set(prefix, value);
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    flattenLeaves(child as Json, prefix ? `${prefix}.${key}` : key, out);
  }
}

// Matches the ICU argument name in both a plain placeholder ({name}) and a
// select/plural/number one ({count, plural, ...}): the name always sits
// right after the opening brace.
const ICU_PLACEHOLDER_PATTERN = /\{\s*(\w+)/g;

function placeholdersIn(value: unknown): Set<string> {
  if (typeof value !== "string") return new Set();
  return new Set(
    [...value.matchAll(ICU_PLACEHOLDER_PATTERN)].map((match) => match[1])
  );
}

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const full = join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      return listSourceFiles(full);
    }
    if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      return [full];
    }
    return [];
  });
}

// Extracts the set of single or double quoted string literal contents in a
// file's source text. Translation keys and namespaces are always plain
// quoted strings (`t("hero.title")`, `useTranslations("contact.form")`), so
// this is enough to detect real usage without a full parser.
const STRING_LITERAL_PATTERN =
  /'([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)"/g;

function stringLiteralsIn(source: string): Set<string> {
  const literals = new Set<string>();
  for (const match of source.matchAll(STRING_LITERAL_PATTERN)) {
    literals.add(match[1] ?? match[2] ?? "");
  }
  return literals;
}

function isConsumedByFile(key: string, literals: Set<string>): boolean {
  if (literals.has(key)) return true;
  const parts = key.split(".");
  for (let i = 1; i < parts.length; i += 1) {
    const namespace = parts.slice(0, i).join(".");
    if (!literals.has(namespace)) continue;
    const remainder = parts.slice(i).join(".");
    if (literals.has(remainder)) return true;
  }
  return false;
}

const en = readJson("messages/en.json");
const tr = readJson("messages/tr.json");
const enKeys = flattenKeys(en, "").sort();
const trKeys = flattenKeys(tr, "").sort();

const enLeaves = new Map<string, Json>();
flattenLeaves(en, "", enLeaves);
const trLeaves = new Map<string, Json>();
flattenLeaves(tr, "", trLeaves);

const sourceFiles = listSourceFiles(repoPath("src"));
const literalsByFile = new Map(
  sourceFiles.map((file) => [
    file,
    stringLiteralsIn(readFileSync(file, "utf8")),
  ])
);

function unconsumedKeys(keys: string[]): string[] {
  return keys.filter(
    (key) =>
      ![...literalsByFile.values()].some((literals) =>
        isConsumedByFile(key, literals)
      )
  );
}

describe("message catalogs", () => {
  it("have identical flattened key sets in en and tr", () => {
    expect(enKeys).toEqual(trKeys);
  });

  it("consumes every en key somewhere under src", () => {
    const unused = unconsumedKeys(enKeys);
    expect(unused, `unconsumed keys: ${unused.join(", ")}`).toEqual([]);
  });

  it("uses the same ICU placeholders in en and tr for every shared key", () => {
    const sharedKeys = enKeys.filter((key) => trLeaves.has(key));
    const mismatches = sharedKeys
      .map((key) => {
        const enPlaceholders = [...placeholdersIn(enLeaves.get(key))].sort();
        const trPlaceholders = [...placeholdersIn(trLeaves.get(key))].sort();
        const same =
          enPlaceholders.length === trPlaceholders.length &&
          enPlaceholders.every(
            (placeholder, index) => placeholder === trPlaceholders[index]
          );
        return same
          ? null
          : `${key}: en=[${enPlaceholders.join(", ")}] tr=[${trPlaceholders.join(", ")}]`;
      })
      .filter((line): line is string => line !== null);

    expect(mismatches, mismatches.join("\n")).toEqual([]);
  });
});
