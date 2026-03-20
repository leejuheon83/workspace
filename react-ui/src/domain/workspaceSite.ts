export type WorkspaceSiteId = string;

export type CompanySite = {
  id: WorkspaceSiteId;
  title: string;
  domain: string;
  description: string;
  category: string;
};

export type PersonalSite = CompanySite & { favorite: boolean };

export type WorkspaceSiteRow = {
  id: string;
  title: string;
  domain: string;
  description: string;
  category: string;
  site_kind: "company" | "personal";
  favorite: boolean;
  user_id: string | null;
  sort_order: number;
  created_at: string;
};
