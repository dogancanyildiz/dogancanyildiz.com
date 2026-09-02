#!/usr/bin/env node
// Stand in for "velite" or "next" in tests/scripts/dev.test.ts. The role is
// read from argv instead of a dedicated flag: scripts/dev.mjs always calls
// velite with "--watch" as its first argument and next with "dev" as its
// first argument, so this fake tells the two apart the same way a person
// reading the process list would.
const role = process.argv[2] === "--watch" ? "velite" : "next";
const prefix = role.toUpperCase();

console.log(`${role} started ${JSON.stringify(process.argv.slice(2))}`);

function handle(signal) {
  console.log(`${role} received ${signal}`);
  process.exit(Number(process.env[`${prefix}_SIGNAL_EXIT_CODE`] ?? "0"));
}

process.on("SIGTERM", () => handle("SIGTERM"));
process.on("SIGINT", () => handle("SIGINT"));

const exitDelayMs = process.env[`${prefix}_EXIT_DELAY_MS`];
if (exitDelayMs !== undefined) {
  setTimeout(() => {
    const killSignal = process.env[`${prefix}_EXIT_VIA_SIGNAL`];
    if (killSignal) {
      // Simulate a crash: the process disappears via an uncatchable signal
      // instead of calling process.exit, so its parent sees code === null.
      process.kill(process.pid, killSignal);
      return;
    }
    const code = Number(process.env[`${prefix}_EXIT_CODE`] ?? "0");
    console.log(`${role} exiting on its own with code ${code}`);
    process.exit(code);
  }, Number(exitDelayMs));
}

// Otherwise idle until a signal arrives, like the real long running
// processes this stands in for.
setInterval(() => {}, 1000 * 60 * 60);
