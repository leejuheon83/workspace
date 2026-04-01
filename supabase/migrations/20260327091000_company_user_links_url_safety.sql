-- Apply the same URL safety guardrails to other link tables if they exist.
-- This migration is conditional: it will skip tables that are not present.

do $$
begin
  -- public.company_links(url)
  if to_regclass('public.company_links') is not null then
    -- Add constraint only if missing
    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'company_links'
        and c.conname = 'company_links_url_safe_ck'
    ) then
      execute $sql$
        alter table public.company_links
          add constraint company_links_url_safe_ck
          check (public.workspace_sites_is_safe_domain(url))
          not valid
      $sql$;
      execute 'alter table public.company_links validate constraint company_links_url_safe_ck';
    end if;
  end if;

  -- public.user_links(url)
  if to_regclass('public.user_links') is not null then
    if not exists (
      select 1
      from pg_constraint c
      join pg_class t on t.oid = c.conrelid
      join pg_namespace n on n.oid = t.relnamespace
      where n.nspname = 'public'
        and t.relname = 'user_links'
        and c.conname = 'user_links_url_safe_ck'
    ) then
      execute $sql$
        alter table public.user_links
          add constraint user_links_url_safe_ck
          check (public.workspace_sites_is_safe_domain(url))
          not valid
      $sql$;
      execute 'alter table public.user_links validate constraint user_links_url_safe_ck';
    end if;
  end if;
end $$;

