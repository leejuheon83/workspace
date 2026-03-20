-- Allow e-hub admins to insert company (fixed) workspace links.
-- Set per user in Supabase: Authentication → Users → user → App Metadata (or User Metadata)
-- JSON: { "ehub_admin": true }

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
    )
  );
