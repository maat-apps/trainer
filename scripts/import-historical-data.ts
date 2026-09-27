import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { parseHistoricalNotes } from "./historical-import.ts";

// One-off importer for trainer#4: this client's historical, pre-app workout
// notes, kept alongside the app rather than part of it. Run it, then import
// the resulting file through the normal Settings > Import flow (trainer#9)
// — no separate upload path needed.
export const RAW_NOTES = `
Split squat
15x8/8x8/6
15x10/10x10/10x7/7
17.5x3/3x3/3 15x4/4x
17.5x7/5x8/5x8/8
17.5x8/8x9/8x8/5

Drążek wyciąg
25x12x9x13
32x8x8
52x8
52x7x7
45x8x6
45x7x9x9
39x12 45x11x9x10
45x10x8x10
52x10x8x8
52x11x10x8

Leg curl
18x12x23x23x12x27x10
27x12x12x12
32x12x11x12
36x12x12x12
41x8x6
41x9x6
36x5
38.3x10
41x8x10
32x12
36x11x9
36x12
38.3x12x12
41x10x7x10

Klata
40x8x8x7
40x10 45x10 50x8
50x10x8x3
55x9x7x5
55x10x9x3 i 3
57.5x10x10x7

Trapbar deadlift
30kgx8 50kgx5
60kgx3x5x4
50kgx6x6x6x6
55kgx5x6x7x7
57.5x8 62.5x8 67.5x8x5
70x4x4x4x4

Wiosło machina
40kgx10x8x6
40kgx7x7x7
40kgx8x?
40kgx4x4x6

Ohp
25x8x7x9
27.5x8x8x7x6
27.5x11x10x10x5
30x6x6x5x?
30x10x9x6x7

Wznosy nóg
X15x15x10
X15x15x12
X20

Wznosy nóg (wersja z podeszwą)
X10x10x9
X10x9

Plank
1minx38
48x38x49
42x38
`;

function buildAppData(firstName: string, lastName: string | null) {
  const { exercises, sessions } = parseHistoricalNotes(RAW_NOTES);
  return {
    categories: [],
    exercises,
    clients: [
      {
        id: crypto.randomUUID(),
        firstName,
        lastName,
        goal: null,
        notes: null,
        createdAt: new Date().toISOString(),
        sessions,
        weightLogs: [],
        periods: [],
      },
    ],
  };
}

export function buildBackup(firstName: string, lastName: string | null) {
  return {
    app: "trainer" as const,
    version: 1,
    exportedAt: new Date().toISOString(),
    data: buildAppData(firstName, lastName),
  };
}

function runCli(): void {
  const { values } = parseArgs({
    options: {
      "first-name": { type: "string" },
      "last-name": { type: "string" },
      out: { type: "string" },
    },
  });

  const firstName = values["first-name"];
  if (!firstName) {
    console.error(
      "Usage: node scripts/import-historical-data.ts --first-name <name> [--last-name <name>] [--out <file>]",
    );
    process.exitCode = 1;
    return;
  }

  const backup = buildBackup(firstName, values["last-name"] ?? null);
  const outPath = values.out ?? "historical-import.json";
  writeFileSync(outPath, JSON.stringify(backup, null, 2));
  const sessionCount = backup.data.clients[0]?.sessions.length ?? 0;
  const exerciseCount = backup.data.exercises.length;
  console.log(
    `Wrote ${sessionCount} sessions across ${exerciseCount} exercises to ${outPath}`,
  );
}

// Only run the CLI when this file is executed directly (`node
// scripts/import-historical-data.ts ...`), not when imported by tests.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
