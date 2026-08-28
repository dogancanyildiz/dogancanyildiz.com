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

// satori also refuses a variable font: the woff copies above still carry fvar
// and gvar, and satori's parser walks the glyf table with the static outline
// layout, which throws "Cannot read properties of undefined" and turns the OG
// route into a 500. fontTools pins the weight axis to a single value and drops
// fvar/gvar, so these static instances are what the route actually loads. Two
// weights because the card mixes 400 body text with a 600 headline, and satori
// picks a face by exact name + weight + style.
const OG_STATIC_FROM_WOFF2 = [
  ["geist-latin.woff2", "geist-latin-400.ttf", 400],
  ["geist-latin.woff2", "geist-latin-600.ttf", 600],
  ["geist-latin-ext.woff2", "geist-latin-ext-400.ttf", 400],
  ["geist-latin-ext.woff2", "geist-latin-ext-600.ttf", 600],
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

function buildOgStaticInstances() {
  mkdirSync(ogFontsDir, { recursive: true });
  for (const [woff2Name, ttfName, weight] of OG_STATIC_FROM_WOFF2) {
    const woff2Path = join(fontsDir, woff2Name);
    const ttfPath = join(ogFontsDir, ttfName);
    const result = spawnSync(
      "python3",
      [
        "-c",
        `from fontTools.ttLib import TTFont, woff2
from fontTools.varLib import instancer
from pathlib import Path
src, dst = ${JSON.stringify([woff2Path, ttfPath])}
weight = ${weight}
tmp = Path(dst).with_suffix(".variable.ttf")
woff2.decompress(src, str(tmp))
font = TTFont(str(tmp))
static = instancer.instantiateVariableFont(
    font, {"wght": weight}, inplace=True, updateFontNames=True
)
static.flavor = None
static.save(dst)
tmp.unlink()
left = [t for t in TTFont(dst).keys() if t in ("fvar", "gvar")]
if left:
    raise SystemExit(f"{Path(dst).name} still carries {left}")
print(f"{Path(dst).name} (wght {weight}, {Path(dst).stat().st_size} bytes)")`,
      ],
      { stdio: "inherit" }
    );
    if (result.status !== 0) {
      throw new Error(`Failed to instance ${woff2Name} at wght ${weight}`);
    }
  }
}

copyAll(WOFF2, fontsDir);
copyAll(LICENSES, fontsDir);
convertOgWoff();
buildOgStaticInstances();
console.log(
  `Vendored ${WOFF2.length + LICENSES.length} files into src/fonts and ${OG_WOFF_FROM_WOFF2.length + OG_STATIC_FROM_WOFF2.length} into public/fonts/og.`
);
