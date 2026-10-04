import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { buildLines } from "./lines.mjs";
const lines = buildLines();
for (const l of lines) {
  const out = `assets/voice/${l.id}.wav`;
  if (existsSync(out)) continue;
  execFileSync("npx", ["-y", "hyperframes@latest", "tts", l.en, "-v", "af_heart", "-s", "0.88", "-o", out, "--json"], { stdio: "inherit" });
}
