import { JSDOM } from "jsdom";
import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function loadRootIndexHtml() {
  const indexPath = path.resolve(process.cwd(), "../index.html");
  const html = readFileSync(indexPath, "utf-8");

  return new JSDOM(html, {
    runScripts: "dangerously",
    // Inline script만 실행하면 되므로 외부 리소스 로딩은 필요 없습니다.
    resources: "usable",
    url: "http://localhost/",
  });
}

describe("root index.html login gate", () => {
  it("로그인 전에는 handleOpen이 window.open을 호출하지 않는다", () => {
    const dom = loadRootIndexHtml();
    const openSpy = vi.fn();
    const alertSpy = vi.fn();

    dom.window.open = openSpy as unknown as typeof window.open;
    dom.window.alert = alertSpy as unknown as typeof window.alert;

    dom.window.localStorage.removeItem("ehub_logged_in_v1");

    dom.window.handleOpen("https://example.com");

    expect(openSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it("로그인 전에는 즐겨찾기(fav-chip)도 열리지 않는다", () => {
    const dom = loadRootIndexHtml();
    const openSpy = vi.fn();
    const alertSpy = vi.fn();

    dom.window.open = openSpy as unknown as typeof window.open;
    dom.window.alert = alertSpy as unknown as typeof window.alert;

    dom.window.localStorage.clear();
    dom.window.renderAll();

    const favButtons = dom.window.document.querySelectorAll(
      'button.fav-chip[data-open-url]',
    );
    expect(favButtons.length).toBeGreaterThan(0);

    const first = favButtons[0] as HTMLButtonElement;
    expect(first.hasAttribute("disabled")).toBe(true);

    // disabled 버튼은 클릭 이벤트가 실행되지 않을 수 있으므로,
    // 실제 게이트 로직(handleOpen)도 URL 기준으로 검증합니다.
    dom.window.handleOpen(first.dataset.openUrl);

    expect(openSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
  });

  it("로그인 후에는 즐겨찾기(fav-chip)도 열릴 수 있다", () => {
    const dom = loadRootIndexHtml();
    const openSpy = vi.fn();

    dom.window.open = openSpy as unknown as typeof window.open;

    dom.window.localStorage.setItem("ehub_logged_in_v1", "true");
    dom.window.renderAll();

    const favButtons = dom.window.document.querySelectorAll(
      'button.fav-chip[data-open-url]',
    );
    expect(favButtons.length).toBeGreaterThan(0);

    const first = favButtons[0] as HTMLButtonElement;
    expect(first.hasAttribute("disabled")).toBe(false);

    dom.window.handleOpen(first.dataset.openUrl);

    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it("로그인 후에는 handleOpen이 window.open을 호출한다", () => {
    const dom = loadRootIndexHtml();
    const openSpy = vi.fn();

    dom.window.open = openSpy as unknown as typeof window.open;
    dom.window.alert = vi.fn() as unknown as typeof window.alert;

    dom.window.localStorage.setItem("ehub_logged_in_v1", "true");

    dom.window.handleOpen("example.com");

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
  });
});

