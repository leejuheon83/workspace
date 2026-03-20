-- Allow company-site insert when JWT email local part matches hardcoded admin employee id(s).
-- Default admin login: 120032@sbsmc.workspace (or any domain — only the part before @ is checked).
-- Add more ids inside IN (...) if needed, or rely on ehub_admin metadata from the previous policy.

drop policy if exists "workspace_sites_company_insert_admin" on public.workspace_sites;

create policy "workspace_sites_company_insert_admin"
  on public.workspace_sites for insert
  to authenticated
  with check (
    site_kind = 'company'
    and user_id is null
    and (
      lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or nullif(split_part(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '@', 1), '') in ('120032')
    )
  );
