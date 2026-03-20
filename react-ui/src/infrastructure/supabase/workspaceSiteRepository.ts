import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceSiteRow } from "../../domain/workspaceSite";

const TABLE = "workspace_sites";

export async function fetchWorkspaceSiteRows(
  client: SupabaseClient,
  userId: string | null,
): Promise<WorkspaceSiteRow[]> {
  const { data: companyData, error: companyError } = await client
    .from(TABLE)
    .select("*")
    .eq("site_kind", "company")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (companyError) {
    throw companyError;
  }

  const companyRows = (companyData ?? []) as WorkspaceSiteRow[];

  if (!userId) {
    return companyRows;
  }

  const { data: personalData, error: personalError } = await client
    .from(TABLE)
    .select("*")
    .eq("site_kind", "personal")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (personalError) {
    throw personalError;
  }

  return [...companyRows, ...((personalData ?? []) as WorkspaceSiteRow[])];
}

export async function insertCompanySite(
  client: SupabaseClient,
  input: { title: string; domain: string; description: string; category: string },
): Promise<void> {
  const { error } = await client.from(TABLE).insert({
    title: input.title.trim(),
    domain: input.domain.trim(),
    description: input.description.trim(),
    category: input.category.trim() || "회사 고정",
    site_kind: "company",
    favorite: false,
    user_id: null,
    sort_order: 0,
  });

  if (error) {
    throw error;
  }
}

export async function updateCompanySite(
  client: SupabaseClient,
  siteId: string,
  input: { title: string; domain: string; description: string; category: string },
): Promise<void> {
  const { data, error } = await client
    .from(TABLE)
    .update({
      title: input.title.trim(),
      domain: input.domain.trim(),
      description: input.description.trim(),
      category: input.category.trim() || "회사 고정",
    })
    .eq("id", siteId)
    .eq("site_kind", "company")
    .select("id");

  if (error) {
    throw error;
  }
  if (!data?.length) {
    throw new Error(
      "회사 고정 메뉴를 수정할 수 없습니다. 관리자 계정·Supabase RLS(삭제·수정 정책) 적용 여부를 확인하세요.",
    );
  }
}

export async function deleteCompanySite(client: SupabaseClient, siteId: string): Promise<void> {
  const { data, error } = await client
    .from(TABLE)
    .delete()
    .eq("id", siteId)
    .eq("site_kind", "company")
    .select("id");

  if (error) {
    throw error;
  }
  if (!data?.length) {
    throw new Error(
      "회사 고정 메뉴를 삭제할 수 없습니다. 프로젝트에 최신 마이그레이션(company DELETE 정책)을 적용했는지, 관리자 JWT(이메일 사번·employee_id·ehub_admin)를 확인하세요.",
    );
  }
}

export async function insertPersonalSite(
  client: SupabaseClient,
  userId: string,
  input: { title: string; domain: string; description: string; category: string },
): Promise<void> {
  const { error } = await client.from(TABLE).insert({
    title: input.title.trim(),
    domain: input.domain.trim(),
    description: input.description.trim(),
    category: input.category,
    site_kind: "personal",
    favorite: false,
    user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function updatePersonalFavorite(
  client: SupabaseClient,
  siteId: string,
  favorite: boolean,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .update({ favorite })
    .eq("id", siteId)
    .eq("site_kind", "personal");

  if (error) {
    throw error;
  }
}

export async function deletePersonalSite(
  client: SupabaseClient,
  siteId: string,
): Promise<void> {
  const { error } = await client
    .from(TABLE)
    .delete()
    .eq("id", siteId)
    .eq("site_kind", "personal");

  if (error) {
    throw error;
  }
}

export async function applyCompanySitesSortOrder(
  client: SupabaseClient,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const { data, error } = await client
        .from(TABLE)
        .update({ sort_order: index })
        .eq("id", id)
        .eq("site_kind", "company")
        .select("id");

      if (error) {
        throw error;
      }
      if (!data?.length) {
        throw new Error(
          "회사 고정 순서를 저장할 수 없습니다. 관리자 권한·RLS를 확인하세요.",
        );
      }
    }),
  );
}

export async function applyPersonalSitesSortOrder(
  client: SupabaseClient,
  userId: string,
  orderedIds: string[],
): Promise<void> {
  await Promise.all(
    orderedIds.map(async (id, index) => {
      const { data, error } = await client
        .from(TABLE)
        .update({ sort_order: index })
        .eq("id", id)
        .eq("site_kind", "personal")
        .eq("user_id", userId)
        .select("id");

      if (error) {
        throw error;
      }
      if (!data?.length) {
        throw new Error("개인 링크 순서를 저장할 수 없습니다.");
      }
    }),
  );
}
