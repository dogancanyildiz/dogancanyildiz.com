// One-off vendoring script. Not a postinstall hook: the copied woff2/woff files
// are committed to the repository so the Docker build never needs the font
// packages or any network access.
import { spawnSync } from "node:child_process";
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

// satori (next/og) cannot read woff2. Geist variable ships woff2 only, so the
// OG image gets woff copies converted from the vendored woff2 subsets.
const OG_WOFF_FROM_WOFF2 = [
  ["geist-latin.woff2", "geist-latin.woff"],
  ["geist-latin-ext.woff2", "geist-latin-ext.woff"],
  ["geist-mono-latin.woff2", "geist-mono-latin.woff"],
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

function convertOgWoff() {
  mkdirSync(ogFontsDir, { recursive: true });
  for (const [woff2Name, woffName] of OG_WOFF_FROM_WOFF2) {
    const woff2Path = join(fontsDir, woff2Name);
    const woffPath = join(ogFontsDir, woffName);
    const result = spawnSync(
      "python3",
      [
        "-c",
        `from fontTools.ttLib import TTFont, woff2
from pathlib import Path
src, dst = ${JSON.stringify([woff2Path, woffPath])}
tmp = Path(dst).with_suffix(".ttf")
woff2.decompress(src, str(tmp))
font = TTFont(str(tmp))
font.flavor = "woff"
font.save(dst)
tmp.unlink()
print(f"{Path(dst).name} ({Path(dst).stat().st_size} bytes)")`,
      ],
      { stdio: "inherit" }
    );
    if (result.status !== 0) {
      throw new Error(`Failed to convert ${woff2Name} to ${woffName}`);
    }
  }
}

copyAll(WOFF2, fontsDir);
copyAll(LICENSES, fontsDir);
convertOgWoff();
console.log(
  `Vendored ${WOFF2.length + LICENSES.length} files into src/fonts and ${OG_WOFF_FROM_WOFF2.length} into public/fonts/og.`
);
