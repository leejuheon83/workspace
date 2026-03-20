/**
 * 로그인된 Supabase CLI로 service_role 키를 조회한 뒤 syncAuthUsersFromCredentials 를 실행합니다.
 * 인자는 sync 스크립트와 동일하게 전달됩니다 (--dry-run, --update-password, 파일 경로 등).
 */
import { execSync, spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const reactUiRoot = join(scriptDir, "..");
const ehubRoot = join(reactUiRoot, "..");
const projectRef = "piaopscawhtxrkxogdpw";

let jsonOut;
try {
  jsonOut = execSync(`npx supabase projects api-keys --project-ref ${projectRef} -o json`, {
    cwd: ehubRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
} catch (e) {
  console.error(
    "Supabase CLI로 API 키를 가져오지 못했습니다. e-hub 폴더에서 `npx supabase login` 후 다시 시도하세요.",
  );
  console.error(e?.message || e);
  process.exit(1);
}

let keys;
try {
  keys = JSON.parse(jsonOut.trim());
} catch {
  console.error("API 키 응답이 JSON이 아닙니다:", jsonOut.slice(0, 200));
  process.exit(1);
}

const sr = keys.find((k) => k.id === "service_role")?.api_key;
if (!sr) {
  console.error("응답에 service_role 키가 없습니다.");
  process.exit(1);
}

const supabaseUrl = `https://${projectRef}.supabase.co`;
const extraArgs = process.argv.slice(2);

const r = spawnSync(process.execPath, ["scripts/syncAuthUsersFromCredentials.mjs", ...extraArgs], {
  cwd: reactUiRoot,
  env: {
    ...process.env,
    SUPABASE_SERVICE_ROLE_KEY: sr,
    SUPABASE_URL: supabaseUrl,
  },
  stdio: "inherit",
});

process.exit(r.status === null ? 1 : r.status);
