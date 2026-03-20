/**
 * e-hub 폴더의 로그인 목록(엑셀/CSV)을 읽어 Supabase Auth 사용자를 만듭니다.
 *
 * 엑셀: 기본 `e-hub/workspace_로그인정보.xlsx` — 시트 `로그인정보`, 열 사번·비밀번호
 * CSV: 헤더에 id/사번, password/비밀번호
 *
 * 환경 변수 (PowerShell 예):
 *   $env:SUPABASE_SERVICE_ROLE_KEY="..."   # 필수 (대시보드 API → service_role)
 * URL/도메인은 react-ui/.env.local 의 VITE_* 를 자동으로 읽습니다.
 *
 * 사용:
 *   npm run auth:sync-credentials
 *   npm run auth:sync-credentials -- ../workspace_로그인정보.xlsx
 *   npm run auth:sync-credentials -- --dry-run
 *   npm run auth:sync-credentials -- --update-password   # 이미 있는 계정 비밀번호를 파일 값으로 갱신
 */

import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reactUiRoot = join(__dirname, "..");
const ehubRoot = join(reactUiRoot, "..");

const DEFAULT_DOMAIN = "sbsmc.workspace";

function loadEnvLocal() {
  /** @type {Record<string, string>} */
  const out = {};
  try {
    const p = join(reactUiRoot, ".env.local");
    const text = readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      out[k] = v;
    }
  } catch {
    // ignore
  }
  return out;
}

function isPlaceholderPassword(pw) {
  const p = (pw || "").trim();
  if (!p) return true;
  if (/여기에|설정할|예시/i.test(p)) return true;
  return false;
}

/** @returns {{ id: string, password: string }[]} */
function parseXlsx(filePath) {
  const wb = XLSX.readFile(filePath);
  const sheetName = wb.SheetNames.includes("로그인정보")
    ? "로그인정보"
    : wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (!rows.length) return [];

  const header = rows[0].map((c) => String(c).trim());
  const norm = (s) => String(s).toLowerCase().replace(/\s+/g, "");

  let idCol = 0;
  let pwCol = 1;
  for (let i = 0; i < header.length; i++) {
    const h = norm(header[i]);
    if (
      h === "id" ||
      h.includes("사번") ||
      h.includes("이메일") ||
      h.includes("로그인id")
    )
      idCol = i;
    if (
      h === "password" ||
      h === "pw" ||
      h.includes("비밀번호") ||
      h.includes("패스워드")
    )
      pwCol = i;
  }

  const looseEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  /** @type {{ id: string, password: string, email?: string }[]} */
  const pairs = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const raw = String(row[idCol] ?? "").trim();
    if (!raw) continue;
    if (raw.startsWith("※")) continue;
    if (raw.startsWith("예:") || raw.includes("예시")) continue;
    if (raw.length > 128) continue;

    let password = String(row[pwCol] ?? "").trim();
    if (raw.includes("@")) {
      if (!looseEmail(raw)) continue;
      if (isPlaceholderPassword(password)) {
        const local = raw.split("@")[0];
        password = local || raw;
      }
      pairs.push({ id: raw.split("@")[0], password, email: raw });
      continue;
    }

    if (!/^[a-zA-Z0-9._+-]+$/.test(raw)) continue;
    if (isPlaceholderPassword(password)) password = raw;
    pairs.push({ id: raw, password });
  }
  return pairs;
}

/** @returns {{ id: string, password: string }[]} */
function parseCsv(filePath) {
  const text = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map((s) => s.trim().toLowerCase());
  const idx = (names) => {
    for (let i = 0; i < header.length; i++) {
      const h = header[i].replace(/\s/g, "");
      for (const n of names) {
        if (h === n || h.includes(n)) return i;
      }
    }
    return -1;
  };

  const idCol = idx(["id", "사번", "이메일", "email"]);
  const pwCol = idx(["password", "비밀번호", "pw"]);
  const ic = idCol >= 0 ? idCol : 0;
  const pc = pwCol >= 0 ? pwCol : 1;

  const looseEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

  /** @type {{ id: string, password: string, email?: string }[]} */
  const pairs = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((s) => s.trim());
    const raw = cols[ic] || "";
    if (!raw) continue;
    let password = cols[pc] || "";
    if (raw.includes("@")) {
      if (!looseEmail(raw)) continue;
      if (isPlaceholderPassword(password)) {
        password = raw.split("@")[0] || raw;
      }
      pairs.push({ id: raw.split("@")[0], password, email: raw });
      continue;
    }
    if (!/^[a-zA-Z0-9._+-]+$/.test(raw)) continue;
    if (isPlaceholderPassword(password)) password = raw;
    pairs.push({ id: raw, password });
  }
  return pairs;
}

function resolveCredentialsFile(argv) {
  const args = argv.filter((a) => !a.startsWith("--"));
  if (args.length > 0) {
    const p = resolve(process.cwd(), args[0]);
    if (existsSync(p)) return p;
    console.error("파일 없음:", p);
    process.exit(1);
  }

  const candidates = [
    join(ehubRoot, "workspace_로그인정보.xlsx"),
    join(ehubRoot, "workspace_로그인정보_새로생성.xlsx"),
    join(ehubRoot, "workspace_로그인정보.csv"),
    join(reactUiRoot, "scripts", "bulk-user-ids.csv"),
  ];

  for (const c of candidates) {
    if (existsSync(c)) return c;
  }

  console.error(
    "로그인 목록 파일을 찾을 수 없습니다. 아래 중 하나를 e-hub 또는 react-ui/scripts 에 두거나 경로를 인자로 주세요.",
  );
  console.error(candidates.join("\n"));
  process.exit(1);
}

async function findUserIdByEmail(supabase, email) {
  let page = 1;
  const perPage = 1000;
  const target = email.toLowerCase();
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const u = data.users.find((x) => (x.email || "").toLowerCase() === target);
    if (u) return u.id;
    if (data.users.length < perPage) return null;
    page++;
  }
}

const envLocal = loadEnvLocal();
const url =
  process.env.SUPABASE_URL?.trim() ||
  process.env.VITE_SUPABASE_URL?.trim() ||
  envLocal.VITE_SUPABASE_URL?.trim() ||
  "";
const serviceRole =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  envLocal.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  "";
const domain =
  process.env.LOGIN_EMAIL_DOMAIN?.trim().replace(/^@/, "") ||
  envLocal.VITE_LOGIN_EMAIL_DOMAIN?.trim().replace(/^@/, "") ||
  DEFAULT_DOMAIN;

const dryRun = process.argv.includes("--dry-run");
const updatePassword = process.argv.includes("--update-password");

const filePath = resolveCredentialsFile(process.argv.slice(2));

/** @type {{ id: string, password: string, email?: string }[]} */
let pairs;
if (filePath.endsWith(".csv")) {
  pairs = parseCsv(filePath);
} else {
  pairs = parseXlsx(filePath);
}

if (!pairs.length) {
  console.error("유효한 사번/비밀번호 행이 없습니다:", filePath);
  process.exit(1);
}

if (!dryRun && (!url || !serviceRole)) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY 가 필요합니다. react-ui/.env.local 에 한 줄 추가:\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=(대시보드 Settings → API → service_role secret)\n" +
      "VITE_ 접두사 없이 넣어야 합니다. (브라우저 번들에 포함되지 않음)",
  );
  console.error("URL:", url ? "OK" : "없음 — VITE_SUPABASE_URL 확인");
  console.error("인식된 계정 수(미반영):", pairs.length, "명 — 키 설정 후 다시 실행하세요.");
  process.exit(1);
}

console.log("파일:", filePath);
console.log("대상:", pairs.length, "명 (도메인:", domain + ")");
if (dryRun) {
  for (const p of pairs) {
    const em = p.email || `${p.id}@${domain}`;
    console.log(" [dry-run]", em, "/ pw:", "*".repeat(Math.min(p.password.length, 8)));
  }
  process.exit(0);
}

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let ok = 0;
let updated = 0;
let skipped = 0;
let fail = 0;

for (const { id, password, email: fixedEmail } of pairs) {
  const email = fixedEmail || `${id}@${domain}`;
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { employee_id: id },
  });

  if (!error) {
    console.log("[생성]", email);
    ok++;
    continue;
  }

  const msg = error.message || String(error);
  if (/already|registered|exists/i.test(msg)) {
    if (updatePassword) {
      try {
        const uid = await findUserIdByEmail(supabase, email);
        if (uid) {
          const { error: uerr } = await supabase.auth.admin.updateUserById(uid, {
            password,
          });
          if (uerr) {
            console.error("[갱신 실패]", email, uerr.message);
            fail++;
          } else {
            console.log("[비밀번호 갱신]", email);
            updated++;
          }
        } else {
          console.warn("[건너뜀] 사용자 ID 조회 실패", email);
          skipped++;
        }
      } catch (e) {
        console.error("[갱신 오류]", email, e);
        fail++;
      }
    } else {
      console.warn("[건너뜀]", email, "— 이미 있음 (--update-password 로 비밀번호 갱신 가능)");
      skipped++;
    }
    continue;
  }

  console.error("[실패]", email, msg);
  fail++;
}

console.log(
  `완료: 생성 ${ok}, 비밀번호갱신 ${updated}, 건너뜀 ${skipped}, 실패 ${fail}`,
);
