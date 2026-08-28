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
});
