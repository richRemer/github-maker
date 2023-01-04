import {runLines} from "github-maker";

export default async function *dependencies(unit) {
  const cmd = "systemctl";
  const args = ["--plain", "list-dependencies", unit];
  let skippedHeader = false;

  for await (const line of runLines(cmd, args)) {
    if (!skippedHeader) {
      skippedHeader = true;
      continue;
    }

    yield line.trim();
  }
}
