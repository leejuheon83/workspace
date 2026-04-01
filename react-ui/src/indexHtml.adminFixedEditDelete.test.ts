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

function login(dom: JSDOM, loginId: string, loginPassword: string) {
  setInput(dom, "loginId", loginId);
  setInput(dom, "loginPassword", loginPassword);
  dom.window.handleLogin({ preventDefault() {} } as any);
}

function parseSites(dom: JSDOM) {
  const raw = dom.window.localStorage.getItem("sbs-ehub-sites-v1");
  if (!raw) return { sites: [] as any[], nextId: 0 };
  const parsed = JSON.parse(raw) as { sites: any[]; nextId: number };
  return parsed;
}

describe("admin fixed site edit/delete", () => {
  it("120032 관리자는 고정(회사) 사이트 수정/삭제가 저장된다", () => {
    const dom = loadRootIndexHtml();
    dom.window.localStorage.clear();

    const alertSpy = vi.spyOn(dom.window, "alert").mockImplementation(() => {});
    alertSpy.mockClear();

    // 1) 관리자 로그인 후 고정 사이트 추가
    login(dom, "120032", "120032");

    setInput(dom, "fName", "FixedCompanyForAdminEditDelete");
    setInput(dom, "fUrl", "example.com");
    setSelectValue(dom, "fCat", "회사");
    setInput(dom, "fMemo", "memo");
    dom.window.submitSiteForm();

    const { sites: afterAdd } = parseSites(dom);
    const added = afterAdd.find((s) => s.name === "FixedCompanyForAdminEditDelete");
    expect(added).toBeTruthy();

    const siteId = added!.id as number;

    // 2) 관리자 권한으로 수정
    dom.window.openEditModal(siteId, { stopPropagation() {} } as any);
    setInput(dom, "fName", "FixedCompanyAdminEdited");
    setInput(dom, "fUrl", "example-edited.com");
    setInput(dom, "fMemo", "memo-edited");
    dom.window.submitSiteForm();

    const { sites: afterEdit } = parseSites(dom);
    const edited = afterEdit.find((s) => s.id === siteId);
    expect(edited).toBeTruthy();
    expect(edited!.name).toBe("FixedCompanyAdminEdited");

    // 3) 관리자 권한으로 삭제
    dom.window.startDelete(siteId, { stopPropagation() {} } as any);
    dom.window.doDelete({ stopPropagation() {} } as any);

    const { sites: afterDelete } = parseSites(dom);
    expect(afterDelete.find((s) => s.id === siteId)).toBeUndefined();
  });

  it("일반 사용자는 고정(회사) 사이트 수정/삭제가 저장되지 않는다", () => {
    const dom = loadRootIndexHtml();
    dom.window.localStorage.clear();

    const alertSpy = vi.spyOn(dom.window, "alert").mockImplementation(() => {});
    alertSpy.mockClear();

    // 1) 관리자 로그인 후 고정 사이트 추가
    login(dom, "120032", "120032");
    setInput(dom, "fName", "FixedCompanyForUserEditDelete");
    setInput(dom, "fUrl", "example.com");
    setSelectValue(dom, "fCat", "회사");
    setInput(dom, "fMemo", "memo");
    dom.window.submitSiteForm();

    const { sites: afterAdd } = parseSites(dom);
    const added = afterAdd.find((s) => s.name === "FixedCompanyForUserEditDelete");
    expect(added).toBeTruthy();

    const siteId = added!.id as number;

    // 2) 일반 로그인 후 수정 시도
    login(dom, "user", "pass");

    dom.window.openEditModal(siteId, { stopPropagation() {} } as any);
    setInput(dom, "fName", "FixedCompanyUserEdited");
    setInput(dom, "fUrl", "example-user-edited.com");
    setInput(dom, "fMemo", "memo-user-edited");
    dom.window.submitSiteForm();

    const { sites: afterEdit } = parseSites(dom);
    const edited = afterEdit.find((s) => s.id === siteId);
    expect(edited).toBeTruthy();
    expect(edited!.name).toBe("FixedCompanyForUserEditDelete");

    // 3) 일반 로그인 후 삭제 시도
    dom.window.startDelete(siteId, { stopPropagation() {} } as any);
    dom.window.doDelete({ stopPropagation() {} } as any);

    const { sites: afterDelete } = parseSites(dom);
    expect(afterDelete.find((s) => s.id === siteId)).toBeTruthy();
    // 삭제 막혔으면 사이트가 그대로 있어야 한다
    expect(afterDelete.find((s) => s.id === siteId)!.name).toBe("FixedCompanyForUserEditDelete");
    expect(alertSpy).toHaveBeenCalled();
  });
});

