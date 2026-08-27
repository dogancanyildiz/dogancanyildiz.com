// One-off vendoring script. Not a postinstall hook: the copied woff2/woff files
// are committed to the repository so the Docker build never needs the font
// packages or any network access.
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = join(projectRoot, "src", "fonts");
const ogFontsDir = join(projectRoot, "public", "fonts", "og");

const WOFF2 = [
  [
    "@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
    "geist-latin.woff2",
  ],
  [
    "@fontsource-variable/geist/files/geist-latin-ext-wght-normal.woff2",
    "geist-latin-ext.woff2",
  ],
  [
    "@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
    "geist-mono-latin.woff2",
  ],
  [
    "@fontsource-variable/geist-mono/files/geist-mono-latin-ext-wght-normal.woff2",
    "geist-mono-latin-ext.woff2",
  ],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2",
    "instrument-serif-latin.woff2",
  ],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-normal.woff2",
    "instrument-serif-latin-ext.woff2",
  ],
];

// satori (next/og) cannot read woff2, so the OG image gets woff copies.
const WOFF = [
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff",
    "instrument-serif-latin.woff",
  ],
  [
    "@fontsource/instrument-serif/files/instrument-serif-latin-ext-400-normal.woff",
    "instrument-serif-latin-ext.woff",
  ],
];

const LICENSES = [
  ["@fontsource-variable/geist/LICENSE", "LICENSE-geist.txt"],
  ["@fontsource-variable/geist-mono/LICENSE", "LICENSE-geist-mono.txt"],
  ["@fontsource/instrument-serif/LICENSE", "LICENSE-instrument-serif.txt"],
];

function copyAll(entries, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  for (const [specifier, targetName] of entries) {
    const source = require.resolve(specifier);
    const target = join(targetDir, targetName);
    copyFileSync(source, target);
    console.log(
      `${targetName} <- ${specifier} (${statSync(target).size} bytes)`
    );
  }
}

copyAll(WOFF2, fontsDir);
copyAll(LICENSES, fontsDir);
copyAll(WOFF, ogFontsDir);
console.log(
  `Vendored ${WOFF2.length + LICENSES.length} files into src/fonts and ${WOFF.length} into public/fonts/og.`
);
