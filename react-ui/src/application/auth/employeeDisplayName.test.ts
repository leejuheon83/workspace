import { describe, expect, it } from "vitest";
import {
  employeeIdForDirectoryLookup,
  parseEmployeeDirectoryJson,
  pickMetadataDisplayName,
  resolveEmployeeGreetingName,
} from "./employeeDisplayName";

describe("parseEmployeeDirectoryJson", () => {
  it("빈·잘못된 입력이면 {}", () => {
    expect(parseEmployeeDirectoryJson(null)).toEqual({});
    expect(parseEmployeeDirectoryJson([])).toEqual({});
    expect(parseEmployeeDirectoryJson("x")).toEqual({});
  });

  it("문자열 키·값만 반영하고 트림", () => {
    expect(
      parseEmployeeDirectoryJson({
        " 120032 ": "  김테스트  ",
        skip: 1,
        x: "",
      }),
    ).toEqual({ "120032": "김테스트" });
  });
});

describe("pickMetadataDisplayName", () => {
  it("full_name 우선", () => {
    expect(
      pickMetadataDisplayName({
        full_name: "홍길동",
        name: "무시",
      }),
    ).toBe("홍길동");
  });

  it("display_name, name 순", () => {
    expect(pickMetadataDisplayName({ display_name: "  이름  " })).toBe("이름");
    expect(pickMetadataDisplayName({ name: "박" })).toBe("박");
  });
});

describe("employeeIdForDirectoryLookup", () => {
  it("employee_id 메타가 있으면 사용", () => {
    expect(employeeIdForDirectoryLookup("x", { employee_id: "120032" })).toBe("120032");
  });

  it("없으면 로컬파트", () => {
    expect(employeeIdForDirectoryLookup("120032", undefined)).toBe("120032");
  });
});

describe("resolveEmployeeGreetingName", () => {
  it("디렉터리가 우선", () => {
    expect(
      resolveEmployeeGreetingName({ "120032": "김직원" }, "120032", {
        full_name: "메타이름",
      }),
    ).toBe("김직원");
  });

  it("디렉터리 없으면 메타", () => {
    expect(
      resolveEmployeeGreetingName({}, "120032", { full_name: "메타이름" }),
    ).toBe("메타이름");
  });

  it("메타 employee_id로 디렉터리 조회", () => {
    expect(
      resolveEmployeeGreetingName({ "120032": "김직원" }, "wrong@local", {
        employee_id: "120032",
      }),
    ).toBe("김직원");
  });
});
