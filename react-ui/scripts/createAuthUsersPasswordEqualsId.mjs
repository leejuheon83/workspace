/**
 * 사번(id)과 동일한 비밀번호로 Supabase Auth 사용자를 만듭니다.
 * 이메일: {id}@{LOGIN_EMAIL_DOMAIN} (기본 sbsmc.workspace) — 앱의 사번 로그인과 동일해야 합니다.
 *
 * 사용 (PowerShell 예시, 키는 절대 Git/채팅에 올리지 마세요):
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="(Dashboard → Settings → API → service_role)"
 *   $env:LOGIN_EMAIL_DOMAIN="sbsmc.workspace"   # 선택, 기본값과 앱 .env와 맞출 것
 *   node scripts/createAuthUsersPasswordEqualsId.mjs ./scripts/bulk-user-ids.csv
 *
 * CSV: 첫 줄 헤더 id, 이후 한 줄에 사번 하나 (쉼표 없이).
 *
 * 엑셀(id+비번 열)은 `npm run auth:sync-credentials` 를 사용하세요.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_DOMAIN = "sbsmc.workspace";

const url =
  process.env.SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || "";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";
const domain =
  process.env.LOGIN_EMAIL_DOMAIN?.trim().replace(/^@/, "") || DEFAULT_DOMAIN;

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("사용법: node scripts/createAuthUsersPasswordEqualsId.mjs <ids.csv>");
  process.exit(1);
}

if (!url || !serviceRole) {
  console.error(
    "SUPABASE_URL(또는 VITE_SUPABASE_URL) 과 SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.",
  );
  process.exit(1);
}

const filePath = resolve(process.cwd(), fileArg);
let lines;
try {
  lines = readFileSync(filePath, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
} catch (e) {
  console.error("파일을 읽을 수 없습니다:", filePath, e);
  process.exit(1);
}

if (lines.length < 2) {
  console.error("CSV에 id 헤더와 최소 1명의 사번이 있어야 합니다.");
  process.exit(1);
}

const header = lines[0].toLowerCase();
if (header !== "id" && !header.startsWith("id,")) {
  console.error('첫 줄은 헤더 "id" 여야 합니다.');
  process.exit(1);
}

const ids = lines.slice(1).map((line) => line.split(",")[0].trim()).filter(Boolean);

const supabase = createClient(url, serviceRole, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let ok = 0;
let fail = 0;

for (const id of ids) {
  const email = `${id}@${domain}`;
  const { error } = await supabase.auth.admin.createUser({
    email,
    password: id,
    email_confirm: true,
    user_metadata: { employee_id: id },
  });

  if (error) {
    const msg = error.message || String(error);
    if (/already|registered|exists/i.test(msg)) {
      console.warn(`[건너뜀] ${email} — 이미 있음`);
    } else {
      console.error(`[실패] ${email}`, msg);
      fail++;
    }
    continue;
  }
  console.log(`[생성] ${email} (비밀번호 = 사번과 동일)`);
  ok++;
}

console.log(`완료: 성공 ${ok}, 실패 ${fail}, 처리 대상 ${ids.length}명`);
