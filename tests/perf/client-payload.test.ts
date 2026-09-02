import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const repoPath = (relative: string) => join(process.cwd(), relative);
const read = (relative: string) => readFileSync(repoPath(relative), "utf8");

const LAYOUT = "src/app/[lang]/layout.tsx";
const CONTACT_PAGE = "src/app/[lang]/contact/page.tsx";

function namespaceListIn(source: string, name: string): string[] {
  const match = source.match(
    new RegExp(`${name} = \\[([\\s\\S]*?)\\] as const`)
  );
  if (!match?.[1]) {
    throw new Error(`no ${name} array literal found in the layout`);
  }
  return [...match[1].matchAll(/"([^"]+)"/g)].map((entry) => entry[1] ?? "");
}

// Walks src/ and returns every file whose first non-blank line is the
// "use client" directive.
function listClientComponentFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listClientComponentFiles(full));
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(entry.name)) continue;
    const source = readFileSync(full, "utf8");
    if (/^\s*["']use client["'];?/.test(source)) files.push(full);
  }
  return files;
}

/**
 * Every message namespace a client component reads, resolved the same way
 * tests/accessibility.test.ts resolves it: the explicit argument of a
 * useTranslations call, or the namespace prefix of a key passed to an
 * unscoped one.
 */
function namespacesReadBy(source: string): Set<string> {
  const required = new Set<string>();
  const hookPattern =
    /\bconst\s+(\w+)\s*=\s*useTranslations\((?:"([^"]+)")?\)/g;
  let hookMatch: RegExpExecArray | null;
  while ((hookMatch = hookPattern.exec(source))) {
    const [, varName, explicitNamespace] = hookMatch;
    if (explicitNamespace) {
      required.add(explicitNamespace.split(".")[0] ?? explicitNamespace);
      continue;
    }
    const callPattern = new RegExp(`\\b${varName}\\(\\s*"([^"]+)"`, "g");
    let callMatch: RegExpExecArray | null;
    while ((callMatch = callPattern.exec(source))) {
      const key = callMatch[1];
      if (key?.includes(".")) required.add(key.split(".")[0] ?? "");
    }
  }
  return required;
}

describe("shell client message catalog", () => {
  const layout = read(LAYOUT);
  const clientNamespaces = namespaceListIn(layout, "CLIENT_MESSAGE_NAMESPACES");
  const routeNamespaces = namespaceListIn(
    layout,
    "ROUTE_SCOPED_MESSAGE_NAMESPACES"
  );

  it("hands the shell provider the client list minus the route scoped ones", () => {
    expect(layout).toContain(
      "pickMessages(messages, CLIENT_MESSAGE_NAMESPACES)"
    );
    expect(layout).toMatch(
      /omitMessages\(\s*clientMessages,\s*ROUTE_SCOPED_MESSAGE_NAMESPACES\s*\)/
    );
    expect(layout).toMatch(
      /<NextIntlClientProvider messages=\{shellMessages\}>/
    );
  });

  it("scopes contact to its own route instead of every page in the shell", () => {
    expect(routeNamespaces).toContain("contact");
  });

  it("keeps every route scoped namespace inside the client list", () => {
    for (const namespace of routeNamespaces) {
      expect(clientNamespaces, namespace).toContain(namespace);
    }
  });

  it("leaves out namespaces no client component reads", () => {
    const readByClients = new Set<string>();
    for (const file of listClientComponentFiles(repoPath("src"))) {
      for (const namespace of namespacesReadBy(readFileSync(file, "utf8"))) {
        readByClients.add(namespace);
      }
    }
    const unread = clientNamespaces.filter(
      (namespace) => !readByClients.has(namespace)
    );
    expect(
      unread,
      `namespaces declared for the client but read by no "use client" component: ${unread.join(", ")}`
    ).toEqual([]);
  });
});

describe("contact route message provider", () => {
  const page = read(CONTACT_PAGE);

  it("wraps the page in a provider that serves only the contact namespace", () => {
    expect(page).toContain(
      'import { NextIntlClientProvider } from "next-intl"'
    );
    expect(page).toMatch(
      /<NextIntlClientProvider messages=\{\{ contact: messages\.contact \}\}>/
    );
  });
});

describe("untranslated path map", () => {
  const layout = read(LAYOUT);

  it("only carries the locales the language switcher can navigate to", () => {
    // The page being rendered exists in the locale it is rendered in, so the
    // current locale's own list is always empty and never has to travel.
    expect(layout).toMatch(/\.filter\(\(locale\) => locale !== lang\)/);
  });
});
