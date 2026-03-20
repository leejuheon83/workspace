import type { CompanySite, PersonalSite } from "../../domain/workspaceSite";

export function filterWorkspaceViews(
  filter: string,
  company: CompanySite[],
  personal: PersonalSite[],
): { company: CompanySite[]; personal: PersonalSite[] } {
  if (filter === "전체") {
    return { company, personal };
  }
  if (filter === "회사 고정") {
    return { company, personal: [] };
  }
  if (filter === "개인") {
    return { company: [], personal };
  }
  return {
    company: company.filter((c) => c.category === filter),
    personal: personal.filter((p) => p.category === filter),
  };
}
