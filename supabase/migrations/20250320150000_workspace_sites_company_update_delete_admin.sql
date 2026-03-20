-- Admin update/delete for company (fixed) workspace_sites rows.
-- Same privilege as insert: ehub_admin metadata or email local part 120032.

create policy "workspace_sites_company_update_admin"
  on public.workspace_sites for update
  to authenticated
  using (
    site_kind = 'company'
    and (
      lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or nullif(split_part(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '@', 1), '') in ('120032')
    )
  )
  with check (
    site_kind = 'company'
    and user_id is null
    and (
      lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or nullif(split_part(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '@', 1), '') in ('120032')
    )
  );

create policy "workspace_sites_company_delete_admin"
  on public.workspace_sites for delete
  to authenticated
  using (
    site_kind = 'company'
    and (
      lower(coalesce(auth.jwt() -> 'app_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'ehub_admin', '')) in ('true', 't', '1', 'yes')
      or nullif(split_part(lower(trim(coalesce(auth.jwt() ->> 'email', ''))), '@', 1), '') in ('120032')
    )
  );
