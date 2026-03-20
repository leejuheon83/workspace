-- Unify company-site admin checks for INSERT/UPDATE/DELETE.
-- Includes JWT email local part and user_metadata.employee_id (matches app isEhubAdmin for default admin 120032).
-- Grant execute so authenticated JWT context is evaluated correctly in policies.

create or replace function public.workspace_sites_is_company_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select
    lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
    or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
    or nullif(split_part(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '@', 1), '') in ('120032')
    or nullif(lower(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'employee_id', ''))), '') in ('120032')
$$;

comment on function public.workspace_sites_is_company_admin() is
  'True if JWT may manage company workspace_sites rows. Add more employee ids inside IN (...) or set ehub_admin metadata.';

grant execute on function public.workspace_sites_is_company_admin() to authenticated;

drop policy if exists "workspace_sites_company_insert_admin" on public.workspace_sites;
drop policy if exists "workspace_sites_company_update_admin" on public.workspace_sites;
drop policy if exists "workspace_sites_company_delete_admin" on public.workspace_sites;

create policy "workspace_sites_company_insert_admin"
  on public.workspace_sites for insert
  to authenticated
  with check (
    site_kind = 'company'
    and user_id is null
    and public.workspace_sites_is_company_admin()
  );

create policy "workspace_sites_company_update_admin"
  on public.workspace_sites for update
  to authenticated
  using (site_kind = 'company' and public.workspace_sites_is_company_admin())
  with check (
    site_kind = 'company'
    and user_id is null
    and public.workspace_sites_is_company_admin()
  );

create policy "workspace_sites_company_delete_admin"
  on public.workspace_sites for delete
  to authenticated
  using (site_kind = 'company' and public.workspace_sites_is_company_admin());
