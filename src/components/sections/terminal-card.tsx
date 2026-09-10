import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand/brand-mark";

/** Characters per second of the typing animation; 16 reads as a fast typist. */
const CPS = 16;
/** Pause after a command finishes typing before its output appears. */
const OUTPUT_DELAY = 0.25;
/** Pause after an output line before the next prompt starts. */
const LINE_GAP = 0.9;

interface Line {
  cmd: string;
  out: string;
}

/**
 * The typed terminal from the GitHub profile hero, rebuilt as HTML so it
 * reads at every width, uses the site's own fonts and tokens (both themes),
 * and respects prefers-reduced-motion through globals.css (.terminal-*).
 *
 * Timing is fixed in CSS custom properties per line: each command types at
 * CPS, its output fades in OUTPUT_DELAY later, the next prompt starts
 * LINE_GAP after that. The width animation runs on `ch` units, exact for a
 * monospace face, so the caret lands on the last glyph without measuring.
 *
 * Decorative: everything it prints is on the page in plain text already
 * (hero, stack strip, the Systems cells), so the block is aria-hidden and a
 * screen reader skips it instead of hearing the name a second time.
 */
export async function TerminalCard() {
  const t = await getTranslations("systems");
  const lines: Line[] = [
    { cmd: "whoami", out: t("terminalWhoami") },
    { cmd: "cat stack.txt", out: t("terminalStack") },
    { cmd: "curl -I dogancanyildiz.com", out: t("terminalCurl") },
  ];

  let clock = 0.4;
  const rows = lines.map((line) => {
    const start = clock;
    const dur = line.cmd.length / CPS;
    const outAt = start + dur + OUTPUT_DELAY;
    clock = outAt + LINE_GAP;
    return { ...line, start, dur, outAt };
  });
  const promptAt = clock;

  return (
    <div className="terminal-card" aria-hidden="true">
      <span className="terminal-watermark">dogancanyildiz</span>
      {/* Steady block on purpose: the header's mark is the one that blinks on
          a page (tests/motion.test.ts), and this card already has a live
          caret of its own on the prompt line. */}
      <BrandMark
        height={64}
        className="absolute top-8 right-8 hidden text-foreground md:block"
      />
      <div className="relative space-y-3 font-mono text-[0.8rem] leading-relaxed sm:text-[0.95rem]">
        {rows.map((row, index) => (
          <div key={row.cmd} className="space-y-1">
            <p className="text-foreground">
              <span className="text-primary">~ $ </span>
              <span
                className="terminal-type"
                style={{
                  ["--w" as string]: `${row.cmd.length}ch`,
                  ["--from" as string]: `${row.start}s`,
                  animationDuration: `${row.dur}s`,
                  animationTimingFunction: `steps(${row.cmd.length})`,
                }}
              >
                {row.cmd}
              </span>
              <span
                className="terminal-cursor"
                style={{
                  ["--from" as string]: `${row.start}s`,
                  ["--to" as string]: `${rows[index + 1]?.start ?? promptAt}s`,
                }}
              />
            </p>
            <p
              className="terminal-reveal text-muted-foreground"
              style={{ ["--from" as string]: `${row.outAt}s` }}
            >
              {row.out}
            </p>
          </div>
        ))}
        <p className="text-foreground">
          <span className="text-primary">~ $ </span>
          <span
            className="terminal-cursor terminal-cursor-final"
            style={{ ["--from" as string]: `${promptAt}s` }}
          />
        </p>
      </div>
    </div>
  );
}
