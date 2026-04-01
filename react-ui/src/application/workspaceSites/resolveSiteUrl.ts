export function resolveSiteUrl(rawInput: string): { ok: true; url: string } | { ok: false; message: string } {
  const raw = rawInput.trim();
  if (!raw) {
    return { ok: false, message: "열 사이트 주소를 입력해 주세요." };
  }

  const lower = raw.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("file:") ||
    lower.startsWith("about:")
  ) {
    return { ok: false, message: "http 또는 https 주소만 열 수 있습니다." };
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!/^https?:$/i.test(url.protocol)) {
      return { ok: false, message: "http 또는 https 주소만 열 수 있습니다." };
    }
    if (!url.hostname) {
      return { ok: false, message: "사이트 주소 형식을 확인해 주세요." };
    }
    const host = url.hostname.toLowerCase();
    if (host === "javascript" || host === "data" || host === "vbscript") {
      return { ok: false, message: "http 또는 https 주소만 열 수 있습니다." };
    }
    return { ok: true, url: url.toString() };
  } catch {
    return { ok: false, message: "사이트 주소 형식을 확인해 주세요." };
  }
}
