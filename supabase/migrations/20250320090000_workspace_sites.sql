-- [How to run] Open this file in your editor, select ALL contents, paste into
-- Supabase Dashboard → SQL Editor → New query, then click Run.
-- Do NOT paste the filename (e.g. supabase/migrations/...) into the editor; that causes ERROR 42601.

create table if not exists public.workspace_sites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  domain text not null,
  description text not null default '',
  category text not null default '개인',
  site_kind text not null check (site_kind in ('company', 'personal')),
  favorite boolean not null default false,
  user_id uuid references auth.users (id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint workspace_sites_kind_user_ck check (
    (site_kind = 'company' and user_id is null)
    or (site_kind = 'personal' and user_id is not null)
  )
);

create index if not exists workspace_sites_user_kind_idx
  on public.workspace_sites (user_id, site_kind);

alter table public.workspace_sites enable row level security;

drop policy if exists "workspace_sites_company_select" on public.workspace_sites;
create policy "workspace_sites_company_select"
  on public.workspace_sites for select
  to anon, authenticated
  using (site_kind = 'company');

drop policy if exists "workspace_sites_personal_select" on public.workspace_sites;
create policy "workspace_sites_personal_select"
  on public.workspace_sites for select
  to authenticated
  using (site_kind = 'personal' and auth.uid() = user_id);

drop policy if exists "workspace_sites_personal_insert" on public.workspace_sites;
create policy "workspace_sites_personal_insert"
  on public.workspace_sites for insert
  to authenticated
  with check (site_kind = 'personal' and auth.uid() = user_id);

drop policy if exists "workspace_sites_personal_update" on public.workspace_sites;
create policy "workspace_sites_personal_update"
  on public.workspace_sites for update
  to authenticated
  using (site_kind = 'personal' and auth.uid() = user_id)
  with check (site_kind = 'personal' and auth.uid() = user_id);

drop policy if exists "workspace_sites_personal_delete" on public.workspace_sites;
create policy "workspace_sites_personal_delete"
  on public.workspace_sites for delete
  to authenticated
  using (site_kind = 'personal' and auth.uid() = user_id);

insert into public.workspace_sites (title, domain, description, category, site_kind, sort_order)
select v.title, v.domain, v.description, v.category, 'company', v.sort_order
from (values
  (0, '전자결재', 'approval.sbsmc.co.kr', '전사 공통 결재 및 문서 승인 시스템', '회사 고정'),
  (1, '공지사항', 'notice.sbsmc.co.kr', '회사 공지, 인사 안내, 운영 공지 확인', '회사 고정'),
  (2, '복리후생', 'benefit.sbsmc.co.kr', '복지 제도, 신청, 사내 지원 프로그램 안내', '회사 고정'),
  (3, '문서함', 'docs.sbsmc.internal', '자주 쓰는 양식, 문서, 공용 자료 모음', '회사 고정')
) as v(sort_order, title, domain, description, category)
where not exists (
  select 1 from public.workspace_sites ws where ws.site_kind = 'company' and ws.title = v.title
);
