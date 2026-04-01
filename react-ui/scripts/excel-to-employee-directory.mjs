/**
 * Reads workspace_로그인정보.xlsx (sheet "로그인정보") and writes react-ui/public/employee-directory.json
 * Columns: A=사번, C=이름(선택) — same layout as npm run gen:login-xlsx
 *
 * Usage: node scripts/excel-to-employee-directory.mjs [path/to/file.xlsx]
 */
import { dirname, join } from "node:path";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reactUiRoot = join(__dirname, "..");
const repoRoot = join(reactUiRoot, "..");
const defaultXlsx = join(repoRoot, "workspace_로그인정보.xlsx");
const outPath = join(reactUiRoot, "public", "employee-directory.json");

const xlsxPath = process.argv[2] || defaultXlsx;

function cellStr(v) {
  if (v == null || v === "") return "";
  return String(v).trim();
}

const LOCAL_PART_RE = /^[a-zA-Z0-9._+-]+$/;

let wb;
try {
  wb = XLSX.readFile(xlsxPath);
} catch (e) {
  console.error("Cannot read:", xlsxPath, e?.message || e);
  process.exit(1);
}

const ws = wb.Sheets["로그인정보"];
if (!ws) {
  console.error('Sheet "로그인정보" not found in', xlsxPath);
  process.exit(1);
}

const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
const map = {};

for (const row of rows) {
  if (!Array.isArray(row)) continue;
  const id = cellStr(row[0]);
  const name = cellStr(row[2]);
  if (!id || !name) continue;
  if (id.includes("※") || id.startsWith("예:")) continue;
  if (!LOCAL_PART_RE.test(id)) continue;
  map[id] = name;
}

writeFileSync(outPath, `${JSON.stringify(map, null, 0)}\n`, "utf8");
console.log("Wrote", outPath, `(${Object.keys(map).length} names)`);
