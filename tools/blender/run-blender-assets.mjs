import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../..");
const blenderScript = join(__dirname, "create-biomed-models.py");

const explicitBinary = process.env.BLENDER_BIN;

const candidateBins = [
  explicitBinary,
  "blender",
  "C:\\Program Files\\Blender Foundation\\Blender\\blender.exe",
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Blender\\blender.exe",
].filter(Boolean);

const foundationDir = "C:\\Program Files\\Blender Foundation";
if (process.platform === "win32" && existsSync(foundationDir)) {
  for (const entry of readdirSync(foundationDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      candidateBins.push(join(foundationDir, entry.name, "blender.exe"));
    }
  }
}

function canRun(binary) {
  const probe = spawnSync(binary, ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32" && binary === "blender",
    stdio: "pipe",
  });

  return probe.status === 0;
}

const blenderBin = candidateBins.find((candidate) => {
  if (!candidate) return false;
  if (candidate !== "blender" && !existsSync(candidate)) return false;
  return canRun(candidate);
});

if (!blenderBin) {
  console.error(
    [
      "No se encontro Blender.",
      "Instala Blender o define BLENDER_BIN con la ruta completa al ejecutable.",
      "Ejemplo Windows: BLENDER_BIN=\"C:\\Program Files\\Blender Foundation\\Blender 4.5\\blender.exe\"",
    ].join("\n"),
  );
  process.exit(1);
}

const result = spawnSync(
  blenderBin,
  ["--background", "--python", blenderScript],
  {
    cwd: root,
    stdio: "inherit",
    shell: false,
  },
);

process.exit(result.status ?? 1);
