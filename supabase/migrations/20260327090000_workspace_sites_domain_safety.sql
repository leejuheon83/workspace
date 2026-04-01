-- Prevent malicious/exotic URL schemes at the database layer.
-- This blocks values like: javascript:..., data:..., file:..., vbscript:..., about:...
-- and only allows either:
--   1) Full http(s) URL:  https://host[/...]
--   2) Host (optionally with :port and path): host.tld[:port][/...]

create or replace function public.workspace_sites_is_safe_domain(input text)
returns boolean
language sql
immutable
security invoker
set search_path = public
as $$
  with v as (
    select lower(trim(coalesce(input, ''))) as s
  )
  select
    -- non-empty and no whitespace/control characters
    s <> ''
    and s !~ '[[:space:]]'
    -- reject dangerous schemes regardless of later normalization
    and s !~ '^(javascript|data|vbscript|file|about):'
    and (
      -- allow full http(s) URL
      s ~ '^https?://[^/[:space:]]+(?::[0-9]{1,5})?(?:/[^[:space:]]*)?$'
      or
      -- allow plain host (optionally :port and path)
      s ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[:][0-9]{1,5})?(?:/[^[:space:]]*)?$'
    )
  from v;
$$;

comment on function public.workspace_sites_is_safe_domain(text) is
  'Validates workspace_sites.domain as either an http(s) URL or a hostname[:port][/path]. Blocks javascript/data/file/vbscript/about schemes.';

-- Apply as CHECK constraint (two-step: NOT VALID then VALIDATE for production safety).
alter table public.workspace_sites
  drop constraint if exists workspace_sites_domain_safe_ck;

alter table public.workspace_sites
  add constraint workspace_sites_domain_safe_ck
  check (public.workspace_sites_is_safe_domain(domain))
  not valid;

alter table public.workspace_sites
  validate constraint workspace_sites_domain_safe_ck;

