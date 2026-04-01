import type { Session } from "@supabase/supabase-js";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  displayLoginIdFromEmail,
  resolveLoginEmail,
} from "./application/auth/resolveLoginEmail";
import { getSupabaseBrowserClient } from "./infrastructure/supabase";
import { isEhubAdmin } from "./application/auth/isEhubAdmin";
import ModalDialog from "./components/ModalDialog";
import PersonalNotepadPanel from "./components/PersonalNotepadPanel";
import type { CompanySite, PersonalSite } from "./domain/workspaceSite";
import { mapWorkspaceSiteRows } from "./application/workspaceSites/mapWorkspaceSiteRows";
import {
  deleteCompanySite,
  deletePersonalSite,
  fetchWorkspaceSiteRows,
  insertCompanySite,
  insertPersonalSite,
  updateCompanySite,
  updatePersonalSite,
} from "./infrastructure/supabase/workspaceSiteRepository";
import { siteTitleEmoji } from "./application/workspaceSites/siteTitleEmoji";
import { isTeamLeaderWorkspaceSite } from "./application/workspaceSites/isTeamLeaderSite";
import { resolveSiteUrl } from "./application/workspaceSites/resolveSiteUrl";

const personalCategories = ["개인", "업무", "기타"] as const;

/** 로그인 헤더: 작은 pill, 내용 길이에 맞춤 · 한 줄 유지 */
const headerActionChipClass =
  "inline-flex h-7 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium leading-none";

function displayUrlLine(domain: string): string {
  const r = resolveSiteUrl(domain);
  return r.ok ? r.url : domain.trim();
}

export default function SbsmcWorkspaceRedesign() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [companySites, setCompanySites] = useState<CompanySite[]>([]);
  const [personalSites, setPersonalSites] = useState<PersonalSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);
  const [sitesError, setSitesError] = useState<string | null>(null);

  const isLoggedIn = session !== null;
  const isAdmin = isEhubAdmin(session?.user ?? null);

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyModalMode, setCompanyModalMode] = useState<"add" | "edit">("add");
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [companyTitle, setCompanyTitle] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyFormError, setCompanyFormError] = useState<string | null>(null);
  const [companyFormSubmitting, setCompanyFormSubmitting] = useState(false);

  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [personalModalMode, setPersonalModalMode] = useState<"add" | "edit">("add");
  const [editingPersonalId, setEditingPersonalId] = useState<string | null>(null);
  const [personalTitle, setPersonalTitle] = useState("");
  const [personalDomain, setPersonalDomain] = useState("");
  const [personalDescription, setPersonalDescription] = useState("");
  const [personalCategory, setPersonalCategory] =
    useState<(typeof personalCategories)[number]>("개인");
  const [personalFormError, setPersonalFormError] = useState<string | null>(null);
  const [personalFormSubmitting, setPersonalFormSubmitting] = useState(false);

  const [showPersonalNotepad, setShowPersonalNotepad] = useState(false);

  async function loadWorkspaceSites(userId: string | null) {
    setSitesError(null);
    setSitesLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchWorkspaceSiteRows(supabase, userId);
      const mapped = mapWorkspaceSiteRows(rows);
      setCompanySites(mapped.company);
      setPersonalSites(mapped.personal);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "목록을 불러오지 못했습니다.";
      setSitesError(msg);
      setCompanySites([]);
      setPersonalSites([]);
    } finally {
      setSitesLoading(false);
    }
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!cancelled) setSession(s);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);
  const headerLoginId = useMemo(
    () => displayLoginIdFromEmail(session?.user.email, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN),
    [session],
  );

  useEffect(() => {
    void loadWorkspaceSites(session?.user.id ?? null);
  }, [session?.user.id]);

  useEffect(() => {
    if (!session) setShowPersonalNotepad(false);
  }, [session]);

  async function onLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    const pw = loginPassword.trim();
    if (!pw) {
      setLoginError("비밀번호를 입력해 주세요.");
      return;
    }
    let email: string;
    try {
      email = resolveLoginEmail(loginId, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "입력을 확인해 주세요.");
      return;
    }
    setLoginSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) {
        setLoginError(error.message);
        return;
      }
      setLoginId("");
      setLoginPassword("");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function onLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setLoginError(null);
    setLoginPassword("");
  }

  function onOpen(url?: string) {
    if (!url) {
      alert("준비 중인 링크입니다.");
      return;
    }
    if (!isLoggedIn) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    const resolved = resolveSiteUrl(url);
    if (!resolved.ok) {
      alert(resolved.message);
      return;
    }
    window.open(resolved.url, "_blank", "noopener,noreferrer");
  }

  function openAddCompany() {
    if (!isAdmin) return;
    setCompanyModalMode("add");
    setEditingCompanyId(null);
    setCompanyFormError(null);
    setCompanyTitle("");
    setCompanyDomain("");
    setCompanyDescription("");
    setShowCompanyModal(true);
  }

  function openEditCompany(site: CompanySite) {
    if (!isAdmin) return;
    setCompanyModalMode("edit");
    setEditingCompanyId(site.id);
    setCompanyFormError(null);
    setCompanyTitle(site.title);
    setCompanyDomain(site.domain);
    setCompanyDescription(site.description);
    setShowCompanyModal(true);
  }

  function closeCompanyModal() {
    setShowCompanyModal(false);
  }

  async function onSaveCompanyModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin || !session?.user.id) {
      setCompanyFormError("관리자만 저장할 수 있습니다.");
      return;
    }

    const title = companyTitle.trim();
    const domain = companyDomain.trim();
    const description = companyDescription.trim();

    if (!title || !domain) {
      setCompanyFormError("제목과 도메인을 입력해 주세요.");
      return;
    }

    const domainOk = resolveSiteUrl(domain);
    if (!domainOk.ok) {
      setCompanyFormError(domainOk.message);
      return;
    }

    setCompanyFormSubmitting(true);
    setCompanyFormError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (companyModalMode === "add") {
        await insertCompanySite(supabase, {
          title,
          domain,
          description,
          category: "회사 고정",
        });
      } else if (editingCompanyId) {
        await updateCompanySite(supabase, editingCompanyId, {
          title,
          domain,
          description,
          category: "회사 고정",
        });
      }

      closeCompanyModal();
      await loadWorkspaceSites(session.user.id);
    } catch (err: unknown) {
      setCompanyFormError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setCompanyFormSubmitting(false);
    }
  }

  async function onDeleteCompany(site: CompanySite) {
    if (!isAdmin || !session?.user.id) return;
    if (!window.confirm(`「${site.title}」 고정 메뉴를 삭제할까요?`)) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await deleteCompanySite(supabase, site.id);
      await loadWorkspaceSites(session.user.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "삭제하지 못했습니다.");
    }
  }

  function openAddPersonal() {
    if (!isLoggedIn || !session?.user.id) {
      alert("로그인 후 이용해 주세요.");
      return;
    }
    setPersonalModalMode("add");
    setEditingPersonalId(null);
    setPersonalFormError(null);
    setPersonalTitle("");
    setPersonalDomain("");
    setPersonalDescription("");
    setPersonalCategory("개인");
    setShowPersonalModal(true);
  }

  function openEditPersonal(site: PersonalSite) {
    if (!session?.user.id) return;
    setPersonalModalMode("edit");
    setEditingPersonalId(site.id);
    setPersonalFormError(null);
    setPersonalTitle(site.title);
    setPersonalDomain(site.domain);
    setPersonalDescription(site.description);
    const cat = site.category;
    setPersonalCategory(
      (personalCategories as readonly string[]).includes(cat)
        ? (cat as (typeof personalCategories)[number])
        : "개인",
    );
    setShowPersonalModal(true);
  }

  function closePersonalModal() {
    setShowPersonalModal(false);
  }

  async function onSavePersonalModal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user.id) {
      setPersonalFormError("로그인이 필요합니다.");
      return;
    }

    const title = personalTitle.trim();
    const domain = personalDomain.trim();
    const description = personalDescription.trim();

    if (!title || !domain) {
      setPersonalFormError("제목과 도메인을 입력해 주세요.");
      return;
    }

    const domainOk = resolveSiteUrl(domain);
    if (!domainOk.ok) {
      setPersonalFormError(domainOk.message);
      return;
    }

    setPersonalFormSubmitting(true);
    setPersonalFormError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (personalModalMode === "add") {
        await insertPersonalSite(supabase, session.user.id, {
          title,
          domain,
          description,
          category: personalCategory,
        });
      } else if (editingPersonalId) {
        await updatePersonalSite(supabase, session.user.id, editingPersonalId, {
          title,
          domain,
          description,
          category: personalCategory,
        });
      }

      closePersonalModal();
      await loadWorkspaceSites(session.user.id);
    } catch (err: unknown) {
      setPersonalFormError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setPersonalFormSubmitting(false);
    }
  }

  async function onDeletePersonal(site: PersonalSite) {
    if (!session?.user.id) return;
    if (!window.confirm(`「${site.title}」 개인 링크를 삭제할까요?`)) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await deletePersonalSite(supabase, site.id);
      await loadWorkspaceSites(session.user.id);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "삭제하지 못했습니다.");
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] p-6 text-slate-800 md:p-8">
      <div
        className={`mx-auto flex w-full max-w-[1400px] flex-col gap-8 ${showPersonalNotepad ? "lg:flex-row lg:items-start" : ""}`}
      >
        <div className="min-w-0 flex-1 space-y-8">
        <header className="rounded-[28px] border border-[#DDE7F3] bg-white/85 p-8 shadow-[0_12px_40px_rgba(31,41,55,0.06)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center rounded-full border border-[#D7E6F8] bg-[#F3F8FF] px-3 py-1 text-xs font-semibold tracking-wide text-[#5B7EA6]">
                SBS M&C WORK HUB
              </p>
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-slate-900">
                사내 주요 서비스와 <span className="text-[#5D8FD8]">개인 워크스페이스</span>를 한곳에
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                공통 메뉴는 안정적으로 유지하고, 개인 링크는 더 유연하고 세련되게 관리하는 대시보드형 관리 싸이트.
              </p>
            </div>
            <div className="grid gap-2 text-sm">
              {isLoggedIn ? (
                <div className="flex flex-nowrap items-center justify-end gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <span
                    className={`${headerActionChipClass} border border-[#D7E6F8] bg-[#F3F8FF] text-[#5B7EA6]`}
                    title={`ID: ${headerLoginId || "로그인됨"}`}
                  >
                    <span className="max-w-[9rem] truncate sm:max-w-none">
                      ID: {headerLoginId || "로그인됨"}
                    </span>
                  </span>
                  {isAdmin ? (
                    <span
                      className={`${headerActionChipClass} border border-[#5D8FD8]/40 bg-[#5D8FD8]/10 font-semibold text-[#1a73e8]`}
                    >
                      관리자
                    </span>
                  ) : null}
                  <button
                    type="button"
                    className={`${headerActionChipClass} border border-[#D7E6F8] bg-white text-[#5D8FD8] shadow-sm`}
                    title={showPersonalNotepad ? "메모장 닫기" : "+ 메모장 열기"}
                    onClick={() => setShowPersonalNotepad((v) => !v)}
                  >
                    {showPersonalNotepad ? "메모장 닫기" : "+ 메모장 열기"}
                  </button>
                  <button
                    type="button"
                    className={`${headerActionChipClass} border border-slate-200 bg-white text-slate-600`}
                    onClick={() => void onLogout()}
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <form className="flex flex-nowrap items-center justify-end gap-2" onSubmit={(e) => void onLoginSubmit(e)}>
                  <input
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="ID"
                    autoComplete="username"
                    className="h-9 w-[120px] rounded-full border border-slate-200 bg-white px-3 text-sm"
                  />
                  <input
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    type="password"
                    placeholder="비밀번호"
                    autoComplete="current-password"
                    className="h-9 w-[140px] rounded-full border border-slate-200 bg-white px-3 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={loginSubmitting}
                    className="h-9 rounded-full bg-[#5D8FD8] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {loginSubmitting ? "…" : "로그인"}
                  </button>
                </form>
              )}
              {loginError ? <div className="text-xs text-[#d93025]">{loginError}</div> : null}
            </div>
          </div>
        </header>

        <section className="rounded-[28px] border border-[#DCE7F5] bg-gradient-to-br from-[#F5F9FF] to-[#EDF4FF] p-6 shadow-[0_10px_30px_rgba(93,143,216,0.08)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-slate-900">
                Company <span className="text-[#5D8FD8]">Workspace</span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                관리자가 고정하는 전사 공통 메뉴입니다. 개인 사용자는 순서 변경이 불가합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-full border border-[#CFE0F6] bg-white px-4 py-2 text-sm font-medium text-[#5D8FD8] shadow-sm">
                고정 메뉴
              </button>
              {isAdmin ? (
                <button
                  type="button"
                  className="rounded-full bg-[#5D8FD8] px-4 py-2 text-sm font-semibold text-white shadow-sm"
                  onClick={openAddCompany}
                >
                  + 고정 메뉴 추가
                </button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[repeat(4,minmax(0,1fr))]">
            {sitesLoading ? (
              <div className="md:col-span-4 text-sm text-slate-500">불러오는 중…</div>
            ) : null}
            {sitesError ? (
              <div className="md:col-span-4 text-sm text-red-600">{sitesError}</div>
            ) : null}
            {companySites.map((site) => {
              const teamLeader = isTeamLeaderWorkspaceSite(site.title, site.description);
              const urlOneLine = displayUrlLine(site.domain);
              return (
              <div
                key={site.id}
                className="group flex h-full min-w-0 flex-col gap-5 rounded-[24px] border border-[#DCE7F5] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(93,143,216,0.12)]"
              >
                <div className="flex min-w-0 flex-col gap-2">
                  <div className="flex min-h-[1.5rem] items-center justify-end gap-1">
                    {isAdmin ? (
                      <>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold leading-none text-[#4e8fd9] shadow-sm ring-1 ring-[#DCE7F5] hover:bg-[#f2f7ff]"
                          aria-label="고정 메뉴 수정"
                          title="수정"
                          onClick={() => openEditCompany(site)}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold leading-none text-[#d93025] shadow-sm ring-1 ring-[#fce8e6] hover:bg-[#fff2f2]"
                          aria-label="고정 메뉴 삭제"
                          title="삭제"
                          onClick={() => void onDeleteCompany(site)}
                        >
                          ✕
                        </button>
                      </>
                    ) : null}
                    <span className="inline-flex h-6 items-center rounded-full border border-[#D5E3F8] bg-[#F7FAFF] px-1.5 text-[9px] font-bold uppercase leading-none tracking-wide text-[#6A8DB6]">
                      LOCK
                    </span>
                  </div>
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1F6FE] text-xl">
                      {siteTitleEmoji(site.title, "company")}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3
                        className="line-clamp-2 min-w-0 break-words text-left text-base font-semibold leading-snug text-slate-800"
                        title={site.title}
                      >
                        {site.title}
                      </h3>
                      <p
                        className="line-clamp-1 min-w-0 break-all text-xs leading-relaxed text-slate-400"
                        title={urlOneLine}
                      >
                        {urlOneLine}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-h-[56px] space-y-3">
                  <p className="text-sm leading-relaxed text-slate-500">{site.description}</p>
                  {teamLeader ? (
                    <span
                      className="inline-flex items-center rounded-full border border-[#F0D8A7] bg-[#FFF7E5] px-2.5 py-1 text-[11px] font-bold leading-normal text-[#B07A18]"
                      aria-label="팀장용"
                    >
                      팀장용
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="mt-auto w-full rounded-full bg-[#7BA7F0] py-3.5 text-sm font-semibold text-white transition group-hover:bg-[#5D8FD8]"
                  onClick={() => onOpen(site.domain)}
                >
                  열기
                </button>
              </div>
            );
            })}
          </div>

          <ModalDialog
            open={showCompanyModal}
            onClose={closeCompanyModal}
            titleId="sbsmc-fixed-menu-modal-title"
          >
            <form className="w-full text-left" onSubmit={(e) => void onSaveCompanyModal(e)}>
              <div
                id="sbsmc-fixed-menu-modal-title"
                className="mb-3 text-sm font-semibold text-slate-900"
              >
                {companyModalMode === "add" ? "고정 메뉴 추가" : "고정 메뉴 수정"}
              </div>

              <div className="grid gap-3">
                <input
                  value={companyTitle}
                  onChange={(e) => setCompanyTitle(e.target.value)}
                  placeholder="제목"
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                <input
                  value={companyDomain}
                  onChange={(e) => setCompanyDomain(e.target.value)}
                  placeholder={
                    companyModalMode === "add"
                      ? "도메인 (예: approval.company.co.kr)"
                      : "도메인"
                  }
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                <input
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="설명"
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                {companyFormError ? (
                  <div className="text-xs text-red-600" role="alert">
                    {companyFormError}
                  </div>
                ) : null}

                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={companyFormSubmitting}
                    className="h-9 flex-1 rounded-full bg-[#5D8FD8] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {companyFormSubmitting ? "…" : "저장"}
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#3c4043]"
                    onClick={closeCompanyModal}
                  >
                    취소
                  </button>
                </div>
              </div>
            </form>
          </ModalDialog>
        </section>

        <section className="rounded-[28px] border border-[#D7E9E4] bg-gradient-to-br from-[#F6FBFA] to-[#EEF7F5] p-6 shadow-[0_10px_30px_rgba(95,179,162,0.08)]">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#CFE7E2] bg-white px-3 py-1 text-xs font-semibold tracking-wide text-[#5F8F86]">
                PERSONAL AREA
              </div>
              <h2 className="mt-3 text-[30px] font-semibold tracking-[-0.03em] text-[#23343B]">
                My <span className="text-[#5FB3A2]">Workspace</span>
              </h2>
              <p className="mt-1 text-sm text-slate-500">직원마다 다르게 추가하는 개인 커스텀 링크 영역입니다.</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-full border border-[#CFE7E2] bg-white px-4 py-2 text-sm font-medium text-[#4E8A7D]"
              >
                개인 링크
              </button>
              <button
                type="button"
                className="rounded-full bg-[#5FB3A2] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(95,179,162,0.22)] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!isLoggedIn}
                onClick={openAddPersonal}
              >
                + 새 링크 추가
              </button>
            </div>
          </div>

          {!isLoggedIn ? (
            <p className="text-sm text-slate-500">로그인하면 개인 링크를 추가·수정·삭제할 수 있습니다.</p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[repeat(4,minmax(0,1fr))]">
            {isLoggedIn && sitesLoading ? (
              <div className="md:col-span-4 text-sm text-slate-500">불러오는 중…</div>
            ) : null}
            {isLoggedIn && personalSites.length === 0 && !sitesLoading ? (
              <div className="md:col-span-4 rounded-2xl border border-dashed border-[#CFE7E2] bg-[#F9FCFB] p-6 text-center text-sm text-slate-500">
                등록된 개인 링크가 없습니다. 「+ 새 링크 추가」로 추가해 보세요.
              </div>
            ) : null}
            {personalSites.map((site) => {
              const urlOneLine = displayUrlLine(site.domain);
              return (
                <div
                  key={site.id}
                  className="group flex h-full min-w-0 flex-col gap-5 rounded-[24px] border border-[#DCEAE7] bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-[0_14px_28px_rgba(95,179,162,0.12)]"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="flex min-h-[1.5rem] items-center justify-end gap-1">
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold leading-none text-[#4E8A7D] shadow-sm ring-1 ring-[#CFE7E2] hover:bg-[#f0faf7]"
                        aria-label="내 링크 수정"
                        title="수정"
                        onClick={() => openEditPersonal(site)}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold leading-none text-[#d93025] shadow-sm ring-1 ring-[#fce8e6] hover:bg-[#fff2f2]"
                        aria-label="내 링크 삭제"
                        title="삭제"
                        onClick={() => void onDeletePersonal(site)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#ECF8F5] text-xl">
                        {siteTitleEmoji(site.title, "personal")}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3
                          className="line-clamp-2 min-w-0 break-words text-left text-base font-semibold leading-snug text-slate-800"
                          title={site.title}
                        >
                          {site.title}
                        </h3>
                        <p
                          className="line-clamp-1 min-w-0 break-all text-xs leading-relaxed text-slate-400"
                          title={urlOneLine}
                        >
                          {urlOneLine}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-h-[48px]">
                    <p className="text-sm leading-relaxed text-slate-500">{site.description}</p>
                  </div>
                  <button
                    type="button"
                    className="mt-auto w-full rounded-full bg-[#5FB3A2] py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(95,179,162,0.22)] transition hover:brightness-[0.97] group-hover:shadow-[0_10px_22px_rgba(95,179,162,0.28)]"
                    onClick={() => onOpen(site.domain)}
                  >
                    열기
                  </button>
                </div>
              );
            })}
          </div>

          <ModalDialog
            open={showPersonalModal}
            onClose={closePersonalModal}
            titleId="sbsmc-personal-link-modal-title"
          >
            <form className="w-full text-left" onSubmit={(e) => void onSavePersonalModal(e)}>
              <div
                id="sbsmc-personal-link-modal-title"
                className="mb-3 text-sm font-semibold text-slate-900"
              >
                {personalModalMode === "add" ? "개인 링크 추가" : "개인 링크 수정"}
              </div>

              <div className="grid gap-3">
                <input
                  value={personalTitle}
                  onChange={(e) => setPersonalTitle(e.target.value)}
                  placeholder="제목"
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                <input
                  value={personalDomain}
                  onChange={(e) => setPersonalDomain(e.target.value)}
                  placeholder="도메인 (예: app.example.com)"
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                <input
                  value={personalDescription}
                  onChange={(e) => setPersonalDescription(e.target.value)}
                  placeholder="설명 (#태그 가능)"
                  className="h-10 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                />

                <div className="flex flex-wrap gap-2">
                  <span className="w-full text-xs font-medium text-slate-500">카테고리</span>
                  {personalCategories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                        personalCategory === c
                          ? "bg-[#5FB3A2] text-white ring-[#5FB3A2]"
                          : "bg-white text-slate-600 ring-[#dadce0] hover:bg-slate-50"
                      }`}
                      onClick={() => setPersonalCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {personalFormError ? (
                  <div className="text-xs text-red-600" role="alert">
                    {personalFormError}
                  </div>
                ) : null}

                <div className="mt-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={personalFormSubmitting}
                    className="h-9 flex-1 rounded-full bg-[#5FB3A2] px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {personalFormSubmitting ? "…" : "저장"}
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#dadce0] px-4 text-sm font-medium text-[#3c4043]"
                    onClick={closePersonalModal}
                  >
                    취소
                  </button>
                </div>
              </div>
            </form>
          </ModalDialog>
        </section>
        </div>

        {showPersonalNotepad ? (
          <aside className="mx-auto w-full max-w-md shrink-0 lg:sticky lg:top-8 lg:mx-0 lg:w-72 lg:max-w-none lg:self-start">
            <PersonalNotepadPanel userId={session?.user.id ?? null} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
