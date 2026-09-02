import { spawn } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const scriptPath = join(process.cwd(), "scripts/dev.mjs");
const fakeBin = join(process.cwd(), "tests/fixtures/fake-bin/fake-process.mjs");

interface RunResult {
  code: number | null;
  signal: NodeJS.Signals | null;
  stdout: string;
}

/**
 * Runs scripts/dev.mjs with both children pointed at the fake process
 * fixture instead of the real velite/next binaries, so the test exercises
 * the orchestration logic (who kills whom, what gets forwarded) without
 * spawning the actual content pipeline or dev server.
 */
function runDev(
  env: Record<string, string>,
  extraArgs: string[] = []
): Promise<RunResult> & { child: ReturnType<typeof spawn> } {
  const child = spawn(process.execPath, [scriptPath, ...extraArgs], {
    env: {
      ...process.env,
      PORTFOLIO_DEV_VELITE_BIN: fakeBin,
      PORTFOLIO_DEV_NEXT_BIN: fakeBin,
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stdout += chunk.toString();
  });

  const promise = new Promise<RunResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`dev.mjs did not exit in time. Output:\n${stdout}`));
    }, 5000);
    child.on("exit", (code, signal) => {
      clearTimeout(timer);
      resolve({ code, signal, stdout: "" });
    });
  }).then((result) => ({ ...result, stdout }));

  return Object.assign(promise, { child });
}

describe("scripts/dev.mjs", () => {
  it("kills the sibling and exits with the same code when next exits first", async () => {
    const result = await runDev({
      NEXT_EXIT_DELAY_MS: "50",
      NEXT_EXIT_CODE: "3",
    });

    expect(result.code).toBe(3);
    expect(result.stdout).toContain("next exiting on its own with code 3");
    expect(result.stdout).toContain("velite received SIGTERM");
  });

  it("kills the sibling and exits with the same code when velite exits first", async () => {
    const result = await runDev({
      VELITE_EXIT_DELAY_MS: "50",
      VELITE_EXIT_CODE: "2",
    });

    expect(result.code).toBe(2);
    expect(result.stdout).toContain("velite exiting on its own with code 2");
    expect(result.stdout).toContain("next received SIGTERM");
  });

  it("exits 1 when a child is killed by a signal instead of exiting cleanly", async () => {
    // A child that dies from an uncatchable signal reports code === null to
    // its parent (Node's own contract for child_process "exit"). scripts/dev.mjs
    // must not read that as a clean 0 exit.
    const result = await runDev({
      NEXT_EXIT_DELAY_MS: "50",
      NEXT_EXIT_VIA_SIGNAL: "SIGKILL",
    });

    expect(result.code).toBe(1);
    expect(result.stdout).toContain("velite received SIGTERM");
  });

  it("forwards SIGINT to both children and shuts down", async () => {
    const runningPromise = runDev({});
    const { child } = runningPromise;

    // Give both fakes a moment to start and register their signal handlers.
    await new Promise((resolve) => setTimeout(resolve, 200));
    child.kill("SIGINT");

    const result = await runningPromise;
    expect(result.stdout).toContain("velite received SIGINT");
    expect(result.stdout).toContain("next received SIGINT");
  });

  it("forwards SIGTERM to both children and shuts down", async () => {
    const runningPromise = runDev({});
    const { child } = runningPromise;

    await new Promise((resolve) => setTimeout(resolve, 200));
    child.kill("SIGTERM");

    const result = await runningPromise;
    expect(result.stdout).toContain("velite received SIGTERM");
    expect(result.stdout).toContain("next received SIGTERM");
  });

  it("passes through extra CLI arguments to next dev", async () => {
    const result = await runDev(
      { NEXT_EXIT_DELAY_MS: "50", NEXT_EXIT_CODE: "0" },
      ["--port", "4000"]
    );

    expect(result.stdout).toContain('next started ["dev","--port","4000"]');
  });

  it("starts velite with --watch regardless of extra CLI arguments", async () => {
    const result = await runDev(
      { NEXT_EXIT_DELAY_MS: "50", NEXT_EXIT_CODE: "0" },
      ["--port", "4000"]
    );

    expect(result.stdout).toContain('velite started ["--watch"]');
  });
});
