import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const outPath = join(repoRoot, "workspace_로그인정보.xlsx");

const sheet1 = [
  ["사번 (로그인 ID)", "비밀번호", "이름(선택)", "비고(선택)"],
  [
    "※ 앱에서는 사번+비밀번호만 입력합니다. Supabase에 사용자를 만들 때는 이메일 칸에 {사번}@sbsmc.workspace 형태로 등록하세요. (도메인은 VITE_LOGIN_EMAIL_DOMAIN 또는 앱 기본값과 동일)",
    "",
    "",
    "",
  ],
  [
    "※ 이 파일에 실제 비밀번호를 적었다면 Git에 커밋하지 마세요.",
    "",
    "",
    "",
  ],
  ["예: 10045", "(여기에 설정할 비밀번호)", "김OO", "예시 행 — 삭제 후 입력"],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
  ["", "", "", ""],
];

const ws = XLSX.utils.aoa_to_sheet(sheet1);
ws["!cols"] = [{ wch: 36 }, { wch: 28 }, { wch: 14 }, { wch: 28 }];

const guide = [
  ["Workspace 로그인정보 엑셀 사용 안내"],
  [""],
  ["1) '사번' 열: 앱 로그인에 쓰는 번호. Supabase에는 10045@sbsmc.workspace 처럼 이메일 형태로 등록."],
  ["2) '비밀번호' 열: 직원에게 전달할 초기 비밀번호. 최초 로그인 후 변경 권장."],
  ["3) Supabase에 사용자 추가: Authentication → Add user → Email = {사번}@도메인, Password 설정"],
  ["4) 보안: 채팅·메일로 대량 전송 자제, 파일 암호화·내부 공유만 권장."],
];

const ws2 = XLSX.utils.aoa_to_sheet(guide);
ws2["!cols"] = [{ wch: 72 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "로그인정보");
XLSX.utils.book_append_sheet(wb, ws2, "안내");

try {
  XLSX.writeFile(wb, outPath);
  console.log("생성됨:", outPath);
} catch (err) {
  if (err && typeof err === "object" && "code" in err && err.code === "EBUSY") {
    const alt = join(repoRoot, "workspace_로그인정보_새로생성.xlsx");
    XLSX.writeFile(wb, alt);
    console.warn(
      "기존 파일이 열려 있어 대체 이름으로 저장했습니다. Excel을 닫은 뒤 `npm run gen:login-xlsx`로 다시 만들 수 있습니다.",
    );
    console.log("생성됨:", alt);
  } else {
    throw err;
  }
}
