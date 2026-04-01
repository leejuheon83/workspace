import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadRootIndexHtml() {
  const indexPath = path.resolve(process.cwd(), "../index.html");
  const html = readFileSync(indexPath, "utf-8");

  return new JSDOM(html, {
    runScripts: "dangerously",
    resources: "usable",
    url: "http://localhost/",
  });
}

function setInput(dom: JSDOM, id: string, value: string) {
  const el = dom.window.document.getElementById(id) as HTMLInputElement | null;
  if (!el) throw new Error(`missing element: ${id}`);
  el.value = value;
}

function setSelectValue(dom: JSDOM, id: string, value: string) {
  const el = dom.window.document.getElementById(id) as HTMLSelectElement | null;
  if (!el) throw new Error(`missing element: ${id}`);
  el.value = value;
}

describe("admin fixed site add", () => {
  it("일반 로그인에서는 '회사' 카테고리 추가가 저장되지 않는다", () => {
    const dom = loadRootIndexHtml();

    dom.window.localStorage.clear();

    const alertSpy = vi.spyOn(dom.window, "alert").mockImplementation(() => {});

    dom.window.document.getElementById("loginId")!.setAttribute("value", "");
    setInput(dom, "loginId", "user");
    setInput(dom, "loginPassword", "pass");
    dom.window.handleLogin({ preventDefault() {} } as any);

    setInput(dom, "fName", "FixedAdminBlockedByUser");
    setInput(dom, "fUrl", "example.com");
    setSelectValue(dom, "fCat", "회사");
    setInput(dom, "fMemo", "memo");

    dom.window.submitSiteForm();

    expect(alertSpy).toHaveBeenCalled();
    expect(dom.window.localStorage.getItem("sbs-ehub-sites-v1")).toBeNull();
  });

  it("admin/admin 로그인에서는 '회사' 카테고리 추가가 저장된다", () => {
    const dom = loadRootIndexHtml();

    dom.window.localStorage.clear();

    const alertSpy = vi.spyOn(dom.window, "alert").mockImplementation(() => {});
    alertSpy.mockClear();

    setInput(dom, "loginId", "admin");
    setInput(dom, "loginPassword", "admin");
    dom.window.handleLogin({ preventDefault() {} } as any);

    setInput(dom, "fName", "FixedAdminAllowed");
    setInput(dom, "fUrl", "example.com");
    setSelectValue(dom, "fCat", "회사");
    setInput(dom, "fMemo", "memo");

    dom.window.submitSiteForm();

    const raw = dom.window.localStorage.getItem("sbs-ehub-sites-v1");
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw || "{}");
    const added = (parsed.sites as any[]).find((s) => s.name === "FixedAdminAllowed");
    expect(added).toBeTruthy();
    expect(added.cat).toBe("회사");
    expect(added.url).toBe("https://example.com");
  });

  it("admin id 120032 로그인에서는 '회사' 카테고리 추가가 저장된다", () => {
    const dom = loadRootIndexHtml();

    dom.window.localStorage.clear();

    const alertSpy = vi.spyOn(dom.window, "alert").mockImplementation(() => {});
    alertSpy.mockClear();

    setInput(dom, "loginId", "120032");
    setInput(dom, "loginPassword", "120032");
    dom.window.handleLogin({ preventDefault() {} } as any);

    setInput(dom, "fName", "FixedAdminAllowedBy120032");
    setInput(dom, "fUrl", "example.com");
    setSelectValue(dom, "fCat", "회사");
    setInput(dom, "fMemo", "memo");

    dom.window.submitSiteForm();

    const raw = dom.window.localStorage.getItem("sbs-ehub-sites-v1");
    expect(raw).not.toBeNull();

    const parsed = JSON.parse(raw || "{}");
    const added = (parsed.sites as any[]).find((s) => s.name === "FixedAdminAllowedBy120032");
    expect(added).toBeTruthy();
    expect(added.cat).toBe("회사");
    expect(added.url).toBe("https://example.com");
  });
});

