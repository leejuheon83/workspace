import type {
  CompanySite,
  PersonalSite,
  WorkspaceSiteRow,
} from "../../domain/workspaceSite";

export function mapWorkspaceSiteRows(rows: WorkspaceSiteRow[]): {
  company: CompanySite[];
  personal: PersonalSite[];
} {
  const company: CompanySite[] = [];
  const personal: PersonalSite[] = [];

  for (const row of rows) {
    if (row.site_kind === "company") {
      company.push({
        id: row.id,
        title: row.title,
        domain: row.domain,
        description: row.description,
        category: row.category,
      });
    } else {
      personal.push({
        id: row.id,
        title: row.title,
        domain: row.domain,
        description: row.description,
        category: row.category,
        favorite: row.favorite,
      });
    }
  }

  return { company, personal };
}
