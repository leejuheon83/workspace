import type { Session } from "@supabase/supabase-js";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { filterWorkspaceViews } from "./application/workspaceSites/filterWorkspaceViews";
import { mapWorkspaceSiteRows } from "./application/workspaceSites/mapWorkspaceSiteRows";
import { isTeamLeaderWorkspaceSite } from "./application/workspaceSites/isTeamLeaderSite";
import { reorderSiteIds } from "./application/workspaceSites/reorderSiteIds";
import { siteTitleEmoji } from "./application/workspaceSites/siteTitleEmoji";
import { resolveSiteUrl } from "./application/workspaceSites/resolveSiteUrl";
import WorkspacePremiumHero from "./components/WorkspacePremiumHero";
import ModalDialog from "./components/ModalDialog";
import { SortableItem } from "./components/workspace/SortableItem";
import { isEhubAdmin } from "./application/auth/isEhubAdmin";
import { resolveEmployeeGreetingName } from "./application/auth/employeeDisplayName";
import { validateNewPasswordPair } from "./application/auth/validatePasswordChange";
import { displayLoginIdFromEmail, resolveLoginEmail } from "./application/auth/resolveLoginEmail";
import { fetchEmployeeDirectory } from "./infrastructure/employeeDirectory/fetchEmployeeDirectory";
import type { CompanySite, PersonalSite } from "./domain/workspaceSite";
import { getSupabaseBrowserClient } from "./infrastructure/supabase";
import {
  applyCompanySitesSortOrder,
  applyPersonalSitesSortOrder,
  deleteCompanySite,
  deletePersonalSite,
  fetchWorkspaceSiteRows,
  insertCompanySite,
  insertPersonalSite,
  updateCompanySite,
  updatePersonalFavorite,
  updatePersonalSite,
} from "./infrastructure/supabase/workspaceSiteRepository";

type Stat = { label: string; value: number };

const filters = ["전체", "회사 고정", "개인", "업무", "기타"] as const;

const personalCategories = ["개인", "업무", "기타"] as const;

export default function EHubRedesign() {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [showPasswordResetPanel, setShowPasswordResetPanel] = useState(false);
  const [pwdResetId, setPwdResetId] = useState("");
  const [pwdResetMsg, setPwdResetMsg] = useState<string | null>(null);
  const [pwdResetSubmitting, setPwdResetSubmitting] = useState(false);
  const [preLoginCurrentPassword, setPreLoginCurrentPassword] = useState("");
  const [preLoginNewPassword, setPreLoginNewPassword] = useState("");
  const [preLoginNewPasswordConfirm, setPreLoginNewPasswordConfirm] = useState("");

  const [showPasswordChangePanel, setShowPasswordChangePanel] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwdChangeMsg, setPwdChangeMsg] = useState<string | null>(null);
  const [pwdChangeSubmitting, setPwdChangeSubmitting] = useState(false);

  const [employeeDirectory, setEmployeeDirectory] = useState<Record<string, string>>({});

  const [companySites, setCompanySites] = useState<CompanySite[]>([]);
  const [personalSites, setPersonalSites] = useState<PersonalSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>(filters[0]);
  const [showPersonalForm, setShowPersonalForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] =
    useState<(typeof personalCategories)[number]>("개인");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingPersonalId, setEditingPersonalId] = useState<string | null>(null);

  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [companyTitle, setCompanyTitle] = useState("");
  const [companyDomain, setCompanyDomain] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [companyCategory, setCompanyCategory] = useState("회사 고정");
  const [companyFormSubmitting, setCompanyFormSubmitting] = useState(false);
  const [companyFormError, setCompanyFormError] = useState<string | null>(null);

  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [editCompanyTitle, setEditCompanyTitle] = useState("");
  const [editCompanyDomain, setEditCompanyDomain] = useState("");
  const [editCompanyDescription, setEditCompanyDescription] = useState("");
  const [editCompanyCategory, setEditCompanyCategory] = useState("회사 고정");
  const [companyCardEditSubmitting, setCompanyCardEditSubmitting] = useState(false);
  const [companyCardEditError, setCompanyCardEditError] = useState<string | null>(null);

  const isLoggedIn = session !== null;
  const isAdmin = isEhubAdmin(session?.user ?? null);

  const loadSites = useCallback(async (userId: string | null) => {
    setSitesError(null);
    setSitesLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchWorkspaceSiteRows(supabase, userId);
      const mapped = mapWorkspaceSiteRows(rows);
      setCompanySites(mapped.company);
      setPersonalSites(mapped.personal);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "목록을 불러오지 못했습니다.";
      setSitesError(msg);
      setCompanySites([]);
      setPersonalSites([]);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let cancelled = false;

    void supabase.auth.getSession().then(({ data: { session: initial } }) => {
      if (!cancelled) {
        setSession(initial);
        setSessionReady(true);
        void loadSites(initial?.user.id ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      void loadSites(next?.user.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadSites]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const dir = await fetchEmployeeDirectory();
      if (!cancelled) setEmployeeDirectory(dir);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const { headerDisplayId, headerGreetingName } = useMemo(() => {
    const email = session?.user?.email;
    const displayId =
      displayLoginIdFromEmail(email, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN) ||
      session?.user?.id ||
      "";
    const meta = session?.user?.user_metadata as Record<string, unknown> | undefined;
    const greetingName = displayId
      ? resolveEmployeeGreetingName(employeeDirectory, displayId, meta)
      : undefined;
    return { headerDisplayId: displayId, headerGreetingName: greetingName };
  }, [session, employeeDirectory]);

  const { company: visibleCompany, personal: visiblePersonal } = useMemo(
    () => filterWorkspaceViews(activeFilter, companySites, personalSites),
    [activeFilter, companySites, personalSites],
  );

  const stats: Stat[] = useMemo(
    () => [
      { label: "회사 고정", value: companySites.length },
      { label: "내 링크", value: personalSites.length },
      { label: "전체 사이트", value: companySites.length + personalSites.length },
    ],
    [companySites.length, personalSites.length],
  );

  const sortModeAll = activeFilter === "전체";
  const companySortable = sortModeAll && isAdmin;
  const personalSortable = sortModeAll && isLoggedIn;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onCompanyDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!companySortable || !session?.user.id) return;
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const ids = companySites.map((s) => s.id);
      const nextIds = reorderSiteIds(ids, String(active.id), String(over.id));
      const reordered = nextIds.map((id) => companySites.find((s) => s.id === id)!);
      setCompanySites(reordered);
      void (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          await applyCompanySitesSortOrder(supabase, nextIds);
        } catch {
          alert("회사 메뉴 순서를 저장하지 못했습니다.");
          await loadSites(session.user.id);
        }
      })();
    },
    [companySortable, session?.user.id, companySites, loadSites],
  );

  const onPersonalDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!personalSortable || !session?.user.id) return;
      const { active, over } = e;
      if (!over || active.id === over.id) return;
      const ids = personalSites.map((s) => s.id);
      const nextIds = reorderSiteIds(ids, String(active.id), String(over.id));
      const reordered = nextIds.map((id) => personalSites.find((s) => s.id === id)!);
      setPersonalSites(reordered);
      void (async () => {
        try {
          const supabase = getSupabaseBrowserClient();
          await applyPersonalSitesSortOrder(supabase, session.user.id, nextIds);
        } catch {
          alert("개인 링크 순서를 저장하지 못했습니다.");
          await loadSites(session.user.id);
        }
      })();
    },
    [personalSortable, session?.user.id, personalSites, loadSites],
  );

  async function onLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);

    const pw = loginPassword.trim();
    let email: string;
    try {
      email = resolveLoginEmail(loginId, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "입력을 확인해 주세요.");
      return;
    }

    if (!pw) {
      setLoginError("비밀번호를 입력해주세요.");
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
      setLoginPassword("");
    } finally {
      setLoginSubmitting(false);
    }
  }

  async function onLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setShowPersonalForm(false);
    setShowCompanyForm(false);
    setEditingCompanyId(null);
    setCompanyCardEditError(null);
    setShowPasswordChangePanel(false);
    resetLoggedInPasswordForm();
  }

  /**
   * 로그아웃 상태: 사번·현재 비밀번호로 로그인 확인 후 즉시 새 비밀번호로 변경 (메일 없음).
   */
  async function onPreLoginDirectPasswordChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdResetMsg(null);
    let email: string;
    try {
      email = resolveLoginEmail(pwdResetId, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN);
    } catch (err) {
      setPwdResetMsg(err instanceof Error ? err.message : "입력을 확인해 주세요.");
      return;
    }
    const current = preLoginCurrentPassword.trim();
    if (!current) {
      setPwdResetMsg("현재 비밀번호를 입력해 주세요.");
      return;
    }
    const pwErr = validateNewPasswordPair(preLoginNewPassword, preLoginNewPasswordConfirm);
    if (pwErr) {
      setPwdResetMsg(pwErr);
      return;
    }
    setPwdResetSubmitting(true);
    const supabase = getSupabaseBrowserClient();
    try {
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email,
        password: current,
      });
      if (signErr) {
        setPwdResetMsg(signErr.message);
        return;
      }
      const { error: updateErr } = await supabase.auth.updateUser({
        password: preLoginNewPassword.trim(),
      });
      if (updateErr) {
        setPwdResetMsg(updateErr.message);
        return;
      }
      setPwdResetMsg("비밀번호가 변경되었습니다.");
      setPreLoginCurrentPassword("");
      setPreLoginNewPassword("");
      setPreLoginNewPasswordConfirm("");
      setPwdResetId("");
    } finally {
      setPwdResetSubmitting(false);
    }
  }

  async function onLoggedInPasswordChangeSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPwdChangeMsg(null);
    const msg = validateNewPasswordPair(newPassword, newPasswordConfirm);
    if (msg) {
      setPwdChangeMsg(msg);
      return;
    }
    if (!session?.user) return;
    setPwdChangeSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword.trim() });
      if (error) {
        setPwdChangeMsg(error.message);
        return;
      }
      setPwdChangeMsg("비밀번호가 변경되었습니다.");
      setNewPassword("");
      setNewPasswordConfirm("");
    } finally {
      setPwdChangeSubmitting(false);
    }
  }

  function resetLoggedInPasswordForm() {
    setNewPassword("");
    setNewPasswordConfirm("");
    setPwdChangeMsg(null);
  }

  function closeLoggedInPasswordModal() {
    resetLoggedInPasswordForm();
    setShowPasswordChangePanel(false);
  }

  function closePreLoginPasswordModal() {
    setPwdResetId("");
    setPreLoginCurrentPassword("");
    setPreLoginNewPassword("");
    setPreLoginNewPasswordConfirm("");
    setPwdResetMsg(null);
    setShowPasswordResetPanel(false);
  }

  function openSite(domainOrUrl: string) {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }
    const resolved = resolveSiteUrl(domainOrUrl);
    if (!resolved.ok) {
      alert(resolved.message);
      return;
    }
    window.open(resolved.url, "_blank", "noopener,noreferrer");
  }

  async function onToggleFavorite(site: PersonalSite) {
    if (!session?.user.id) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await updatePersonalFavorite(supabase, site.id, !site.favorite);
      await loadSites(session.user.id);
    } catch {
      alert("즐겨찾기를 변경하지 못했습니다.");
    }
  }

  async function onDeletePersonal(site: PersonalSite) {
    if (!session?.user.id) return;
    if (!window.confirm(`「${site.title}」 링크를 삭제할까요?`)) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await deletePersonalSite(supabase, site.id);
      await loadSites(session.user.id);
    } catch {
      alert("삭제하지 못했습니다.");
    }
  }

  async function onPersonalFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user.id) return;
    setFormError(null);
    const title = newTitle.trim();
    const domain = newDomain.trim();
    if (!title || !domain) {
      setFormError("제목과 도메인을 입력해 주세요.");
      return;
    }
    setFormSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      if (editingPersonalId) {
        await updatePersonalSite(supabase, session.user.id, editingPersonalId, {
          title,
          domain,
          description: newDescription.trim(),
          category: newCategory,
        });
      } else {
        await insertPersonalSite(supabase, session.user.id, {
          title,
          domain,
          description: newDescription.trim(),
          category: newCategory,
        });
      }
      setNewTitle("");
      setNewDomain("");
      setNewDescription("");
      setNewCategory("개인");
      setEditingPersonalId(null);
      setShowPersonalForm(false);
      await loadSites(session.user.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : editingPersonalId
            ? "수정하지 못했습니다."
            : "추가하지 못했습니다.";
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  function openAddPersonal() {
    if (!isLoggedIn) {
      alert("로그인 후 개인 링크를 추가할 수 있습니다.");
      return;
    }
    setFormError(null);
    setEditingPersonalId(null);
    setNewTitle("");
    setNewDomain("");
    setNewDescription("");
    setNewCategory("개인");
    setShowPersonalForm(true);
  }

  function openEditPersonal(site: PersonalSite) {
    if (!isLoggedIn || !session?.user.id) {
      alert("로그인 후 개인 링크를 수정할 수 있습니다.");
      return;
    }
    setFormError(null);
    setEditingPersonalId(site.id);
    setNewTitle(site.title);
    setNewDomain(site.domain);
    setNewDescription(site.description);
    const cat = site.category;
    setNewCategory(
      (personalCategories as readonly string[]).includes(cat)
        ? (cat as (typeof personalCategories)[number])
        : "개인",
    );
    setShowPersonalForm(true);
  }

  function closePersonalForm() {
    setShowPersonalForm(false);
    setEditingPersonalId(null);
    setFormError(null);
  }

  async function onAddCompanySubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user.id || !isAdmin) return;
    setCompanyFormError(null);
    const title = companyTitle.trim();
    const domain = companyDomain.trim();
    if (!title || !domain) {
      setCompanyFormError("제목과 도메인을 입력해 주세요.");
      return;
    }
    setCompanyFormSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await insertCompanySite(supabase, {
        title,
        domain,
        description: companyDescription.trim(),
        category: companyCategory.trim() || "회사 고정",
      });
      setCompanyTitle("");
      setCompanyDomain("");
      setCompanyDescription("");
      setCompanyCategory("회사 고정");
      setShowCompanyForm(false);
      await loadSites(session.user.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "추가하지 못했습니다. 관리자 사번(기본 120032) 로그인·DB 정책을 확인하세요.";
      setCompanyFormError(msg);
    } finally {
      setCompanyFormSubmitting(false);
    }
  }

  function startEditCompany(site: CompanySite) {
    if (!isAdmin) return;
    setCompanyCardEditError(null);
    setShowCompanyForm(false);
    setEditingCompanyId(site.id);
    setEditCompanyTitle(site.title);
    setEditCompanyDomain(site.domain);
    setEditCompanyDescription(site.description);
    setEditCompanyCategory(site.category.trim() || "회사 고정");
  }

  function cancelEditCompany() {
    setEditingCompanyId(null);
    setCompanyCardEditError(null);
  }

  async function onSaveCompanyCardEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user.id || !editingCompanyId) return;
    if (!isAdmin) {
      setCompanyCardEditError("관리자만 수정할 수 있습니다.");
      return;
    }
    setCompanyCardEditError(null);
    const title = editCompanyTitle.trim();
    const domain = editCompanyDomain.trim();
    if (!title || !domain) {
      setCompanyCardEditError("제목과 도메인을 입력해 주세요.");
      return;
    }
    setCompanyCardEditSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await updateCompanySite(supabase, editingCompanyId, {
        title,
        domain,
        description: editCompanyDescription.trim(),
        category: editCompanyCategory.trim() || "회사 고정",
      });
      cancelEditCompany();
      await loadSites(session.user.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "저장하지 못했습니다. 관리자 권한·DB 정책을 확인하세요.";
      setCompanyCardEditError(msg);
    } finally {
      setCompanyCardEditSubmitting(false);
    }
  }

  async function onDeleteCompany(site: CompanySite) {
    if (!session?.user.id || !isAdmin) return;
    if (!window.confirm(`「${site.title}」 회사 고정 메뉴를 삭제할까요?`)) return;
    try {
      const supabase = getSupabaseBrowserClient();
      await deleteCompanySite(supabase, site.id);
      if (editingCompanyId === site.id) cancelEditCompany();
      await loadSites(session.user.id);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "삭제하지 못했습니다.";
      alert(msg);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--ws-bg)] text-[#202124]">
      <div className="mx-auto max-w-[1280px] px-5 py-4 lg:px-8">
        <header className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href="/"
            className="flex shrink-0 items-end transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a73e8]/30 rounded-lg"
            aria-label="홈"
          >
            <img
              src="/sbsmc-logo.png"
              alt="SBS M&C"
              className="h-[88px] w-auto max-w-[min(85vw,420px)] object-contain object-left"
              decoding="async"
            />
          </a>
          <div className="flex flex-col items-end gap-2 sm:items-end">
            {isLoggedIn ? (
              <div className="flex w-full max-w-full flex-col items-end gap-2 sm:w-auto">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-0.5 text-sm leading-reading">
                    {headerGreetingName ? (
                      <span className="font-medium text-[#202124]">{headerGreetingName}님</span>
                    ) : null}
                    <span className="font-normal text-[#5f6368]">{headerDisplayId}</span>
                  </span>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
                    onClick={() => {
                      if (showPasswordChangePanel) closeLoggedInPasswordModal();
                      else setShowPasswordChangePanel(true);
                    }}
                  >
                    비밀번호 변경
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#dadce0] bg-white px-4 text-sm font-medium text-[#3c4043] transition hover:bg-[#f8f9fa]"
                    onClick={() => void onLogout()}
                  >
                    로그아웃
                  </button>
                </div>
                <ModalDialog
                  open={showPasswordChangePanel}
                  onClose={closeLoggedInPasswordModal}
                  titleId="ehub-modal-pwd-logged-in-title"
                >
                  <form
                    className="w-full text-left"
                    onSubmit={(e) => void onLoggedInPasswordChangeSubmit(e)}
                  >
                    <div
                      id="ehub-modal-pwd-logged-in-title"
                      className="mb-3 pr-10 text-sm font-medium text-[var(--ws-text-main)]"
                    >
                      비밀번호 변경
                    </div>
                    <div className="grid gap-2">
                      <label className="sr-only" htmlFor="newPassword">
                        새 비밀번호
                      </label>
                      <input
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        type="password"
                        autoComplete="new-password"
                        placeholder="새 비밀번호"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                      <label className="sr-only" htmlFor="newPasswordConfirm">
                        새 비밀번호 확인
                      </label>
                      <input
                        id="newPasswordConfirm"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        type="password"
                        autoComplete="new-password"
                        placeholder="새 비밀번호 확인"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                    </div>
                    {pwdChangeMsg ? (
                      <div
                        className={`mt-2 text-xs leading-reading ${
                          pwdChangeMsg.includes("변경되었") ? "text-[#137333]" : "text-[#d93025]"
                        }`}
                        aria-live="polite"
                      >
                        {pwdChangeMsg}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <button
                        type="submit"
                        disabled={pwdChangeSubmitting}
                        className="h-9 rounded-full bg-[var(--ws-btn-bg)] px-4 text-sm font-medium text-[var(--ws-btn-text)] transition hover:bg-[var(--ws-accent-hover)] disabled:opacity-60"
                      >
                        {pwdChangeSubmitting ? "…" : "변경"}
                      </button>
                    </div>
                  </form>
                </ModalDialog>
              </div>
            ) : (
              <div className="flex w-full max-w-full flex-col items-end gap-2 sm:w-auto">
                <form
                  className="flex flex-wrap items-center justify-end gap-2"
                  onSubmit={(e) => void onLoginSubmit(e)}
                >
                  <div>
                    <label className="sr-only" htmlFor="loginId">
                      사번
                    </label>
                    <input
                      id="loginId"
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value)}
                      placeholder="사번"
                      autoComplete="username"
                      className="h-9 w-[200px] max-w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                    />
                  </div>

                  <div>
                    <label className="sr-only" htmlFor="loginPassword">
                      비밀번호
                    </label>
                    <input
                      id="loginPassword"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="비밀번호"
                      type="password"
                      autoComplete="current-password"
                      className="h-9 w-[200px] max-w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loginSubmitting}
                    className="h-9 w-auto rounded-full bg-[#1a73e8] px-5 text-sm font-medium text-white transition hover:bg-[#1765cc] whitespace-nowrap disabled:opacity-60"
                  >
                    {loginSubmitting ? "…" : "로그인"}
                  </button>
                </form>
                <button
                  type="button"
                  className="text-xs font-medium text-[#1a73e8] underline-offset-2 hover:underline"
                  onClick={() => {
                    if (showPasswordResetPanel) closePreLoginPasswordModal();
                    else setShowPasswordResetPanel(true);
                  }}
                >
                  비밀번호 변경
                </button>
                <ModalDialog
                  open={showPasswordResetPanel}
                  onClose={closePreLoginPasswordModal}
                  titleId="ehub-modal-pwd-prelogin-title"
                >
                  <form
                    className="w-full text-left"
                    onSubmit={(e) => void onPreLoginDirectPasswordChange(e)}
                  >
                    <div
                      id="ehub-modal-pwd-prelogin-title"
                      className="mb-1 pr-10 text-sm font-medium text-[var(--ws-text-main)]"
                    >
                      비밀번호 변경
                    </div>
                    <p className="mb-3 text-xs font-normal leading-reading text-[var(--ws-text-sub)]">
                      사번과 현재 비밀번호를 입력한 뒤 「비밀번호 변경」으로 새 비밀번호를 설정할 수 있습니다.
                    </p>
                    <div className="grid gap-2">
                      <label className="sr-only" htmlFor="pwdResetId">
                        사번
                      </label>
                      <input
                        id="pwdResetId"
                        value={pwdResetId}
                        onChange={(e) => setPwdResetId(e.target.value)}
                        placeholder="사번"
                        autoComplete="username"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                      <label className="sr-only" htmlFor="preLoginCurrentPassword">
                        현재 비밀번호
                      </label>
                      <input
                        id="preLoginCurrentPassword"
                        value={preLoginCurrentPassword}
                        onChange={(e) => setPreLoginCurrentPassword(e.target.value)}
                        placeholder="현재 비밀번호"
                        type="password"
                        autoComplete="current-password"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                      <label className="sr-only" htmlFor="preLoginNewPassword">
                        새 비밀번호
                      </label>
                      <input
                        id="preLoginNewPassword"
                        value={preLoginNewPassword}
                        onChange={(e) => setPreLoginNewPassword(e.target.value)}
                        placeholder="새 비밀번호"
                        type="password"
                        autoComplete="new-password"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                      <label className="sr-only" htmlFor="preLoginNewPasswordConfirm">
                        새 비밀번호 확인
                      </label>
                      <input
                        id="preLoginNewPasswordConfirm"
                        value={preLoginNewPasswordConfirm}
                        onChange={(e) => setPreLoginNewPasswordConfirm(e.target.value)}
                        placeholder="새 비밀번호 확인"
                        type="password"
                        autoComplete="new-password"
                        className="h-9 w-full rounded-full border border-[#dadce0] bg-white px-4 text-sm text-[#202124] placeholder:text-[#9aa0a6] focus:border-[#1a73e8] focus:outline-none focus:ring-2 focus:ring-[#1a73e8]/20"
                      />
                    </div>
                    {pwdResetMsg ? (
                      <div
                        className={`mt-2 text-xs leading-reading ${
                          pwdResetMsg.includes("변경되었") ? "text-[#137333]" : "text-[#d93025]"
                        }`}
                        aria-live="polite"
                      >
                        {pwdResetMsg}
                      </div>
                    ) : null}
                    <div className="mt-3">
                      <button
                        type="submit"
                        disabled={pwdResetSubmitting}
                        className="h-9 rounded-full bg-[var(--ws-btn-bg)] px-4 text-sm font-medium text-[var(--ws-btn-text)] transition hover:bg-[var(--ws-accent-hover)] disabled:opacity-60"
                      >
                        {pwdResetSubmitting ? "…" : "비밀번호 변경"}
                      </button>
                    </div>
                  </form>
                </ModalDialog>
              </div>
            )}

            {loginError ? (
              <div className="mt-1 max-w-[320px] text-xs text-[#d93025]" aria-live="polite">
                {loginError}
              </div>
            ) : null}
          </div>
        </header>

        {isLoggedIn && isAdmin ? (
          <div
            className="mb-5 rounded-[20px] border border-amber-200 bg-amber-50/90 px-5 py-4 shadow-sm"
            aria-label="관리자 메뉴"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm font-semibold text-[#202124]">관리자 메뉴</div>
              <button
                type="button"
                className="h-10 shrink-0 rounded-full bg-[#1a73e8] px-5 text-sm font-medium text-white transition hover:bg-[#1765cc]"
                onClick={() => {
                  setCompanyFormError(null);
                  setShowCompanyForm((v) => !v);
                }}
              >
                + 사이트 추가
              </button>
            </div>

            {showCompanyForm ? (
              <form
                className="mt-4 rounded-[16px] border border-amber-100 bg-white/90 p-4"
                onSubmit={(e) => void onAddCompanySubmit(e)}
              >
                <div className="mb-2 text-xs font-medium text-[#202124]">회사 고정 메뉴 추가</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={companyTitle}
                    onChange={(e) => setCompanyTitle(e.target.value)}
                    placeholder="제목"
                    className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                  />
                  <input
                    value={companyDomain}
                    onChange={(e) => setCompanyDomain(e.target.value)}
                    placeholder="도메인 (예: approval.company.co.kr)"
                    className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                  />
                  <input
                    value={companyDescription}
                    onChange={(e) => setCompanyDescription(e.target.value)}
                    placeholder="설명"
                    className="h-10 rounded-full border border-[#dadce0] px-4 text-sm sm:col-span-2"
                  />
                  <input
                    value={companyCategory}
                    onChange={(e) => setCompanyCategory(e.target.value)}
                    placeholder="카테고리 (기본: 회사 고정)"
                    className="h-10 rounded-full border border-[#dadce0] px-4 text-sm sm:col-span-2"
                  />
                </div>
                {companyFormError ? (
                  <div className="mt-2 text-xs text-[#d93025]">{companyFormError}</div>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={companyFormSubmitting}
                    className="h-9 rounded-full bg-[#1a73e8] px-4 text-sm font-medium text-white disabled:opacity-60"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    className="h-9 rounded-full border border-[#dadce0] px-4 text-sm text-[#3c4043]"
                    onClick={() => setShowCompanyForm(false)}
                  >
                    취소
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {sitesError ? (
          <div
            className="mb-4 rounded-2xl border border-[#fce8e6] bg-[#fce8e6]/40 px-4 py-3 text-sm text-[#c5221f]"
            role="alert"
          >
            사이트 목록을 불러오지 못했습니다: {sitesError}
            <div className="mt-1 text-xs font-normal leading-reading text-[#5f6368]">
              Supabase SQL Editor에서{" "}
              <code className="rounded bg-white/80 px-1">supabase/migrations/20250320090000_workspace_sites.sql</code>{" "}
              내용을 실행했는지 확인해 주세요.
            </div>
          </div>
        ) : null}

        <WorkspacePremiumHero />

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[20px] border border-[#e8eaed] bg-white px-5 py-5 text-center"
            >
              <div className="text-[28px] font-semibold text-[#1a73e8]">{item.value}</div>
              <div className="mt-1 text-sm font-normal leading-reading text-[#5f6368]">{item.label}</div>
            </div>
          ))}
        </section>

        <section className="mt-12">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[34px] font-semibold text-[#202124]">Workspace 구성</h2>
              <p className="mt-1 text-sm font-normal leading-reading text-[#5f6368]">
                회사 공통 메뉴는 고정하고, 아래에 개인 커스텀 링크를 따로 배치한 구조입니다.
              </p>
            </div>
            <div className="text-sm font-normal leading-reading text-[#5f6368]">
              {sitesLoading && sessionReady ? "불러오는 중…" : null}
              총 {companySites.length + personalSites.length}
              개
            </div>
          </div>

          <div className="mb-7 flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`h-9 rounded-full px-4 text-sm font-medium transition ${
                  filter === activeFilter
                    ? "bg-[#1a73e8] text-white"
                    : "border border-[#dadce0] bg-white text-[#3c4043] hover:bg-[#f8f9fa]"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {sortModeAll && isLoggedIn ? (
            <p className="mb-6 text-xs font-normal leading-reading text-[#5f6368]">
              카드 왼쪽 <span className="font-mono">⋮⋮</span> 핸들을 드래그하면 순서를 바꿀 수 있습니다. 변경 내용은 저장되며, 회사 고정은
              관리자만, 내 링크는 본인만 바꿀 수 있습니다.
            </p>
          ) : null}

          {showPersonalForm && isLoggedIn ? (
            <form
              onSubmit={(e) => void onPersonalFormSubmit(e)}
              className="mb-8 rounded-[24px] border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] p-5 shadow-sm"
            >
              <div className="mb-3 text-sm font-medium text-[var(--ws-text-main)]">
                {editingPersonalId ? "개인 링크 수정" : "개인 링크 추가"}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="제목"
                  className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                />
                <input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="도메인 (예: app.example.com)"
                  className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                />
                <input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="설명"
                  className="h-10 rounded-full border border-[#dadce0] px-4 text-sm sm:col-span-2"
                />
                <select
                  value={newCategory}
                  onChange={(e) =>
                    setNewCategory(e.target.value as (typeof personalCategories)[number])
                  }
                  className="h-10 rounded-full border border-[#dadce0] bg-white px-4 text-sm"
                >
                  {personalCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {formError ? (
                <div className="mt-2 text-xs text-[#d93025]">{formError}</div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="h-10 rounded-full bg-[var(--ws-btn-bg)] px-5 text-sm font-medium text-[var(--ws-btn-text)] transition hover:bg-[var(--ws-accent-hover)] disabled:opacity-60"
                >
                  저장
                </button>
                <button
                  type="button"
                  className="h-10 rounded-full border border-[#dadce0] px-5 text-sm text-[#3c4043]"
                  onClick={closePersonalForm}
                >
                  취소
                </button>
              </div>
            </form>
          ) : null}

          <div className="mb-6 rounded-[24px] border border-[#dbe7fb] bg-[#eef4ff] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[22px] font-semibold text-[#202124]">Company</div>
                <p className="mt-1 text-sm font-normal leading-reading text-[#5f6368]">
                  관리자가 고정하는 전사 공통 메뉴입니다. 일반 사용자는 삭제·순서 변경이 불가합니다.
                </p>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-[#1a73e8]">고정 메뉴</div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCompanyDragEnd}>
            <SortableContext items={visibleCompany.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
                {visibleCompany.map((site) => {
                  const isEditingCard = editingCompanyId === site.id;
                  return (
                    <SortableItem
                      key={site.id}
                      id={site.id}
                      sortEnabled={companySortable && !isEditingCard}
                      className="flex h-full flex-col rounded-[24px] border border-[#dbe7fb] bg-white p-5 transition hover:-translate-y-[2px] hover:shadow-[0_1px_3px_rgba(60,64,67,0.2),0_4px_12px_rgba(60,64,67,0.12)]"
                    >
                      {(handle) =>
                        isEditingCard && isAdmin ? (
                          <form onSubmit={(e) => void onSaveCompanyCardEdit(e)}>
                            <div className="mb-3 text-xs font-medium text-[#202124]">회사 고정 메뉴 수정</div>
                            <div className="grid gap-2">
                              <input
                                value={editCompanyTitle}
                                onChange={(e) => setEditCompanyTitle(e.target.value)}
                                placeholder="제목"
                                className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                              />
                              <input
                                value={editCompanyDomain}
                                onChange={(e) => setEditCompanyDomain(e.target.value)}
                                placeholder="도메인"
                                className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                              />
                              <input
                                value={editCompanyDescription}
                                onChange={(e) => setEditCompanyDescription(e.target.value)}
                                placeholder="설명"
                                className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                              />
                              <input
                                value={editCompanyCategory}
                                onChange={(e) => setEditCompanyCategory(e.target.value)}
                                placeholder="카테고리 (기본: 회사 고정)"
                                className="h-10 rounded-full border border-[#dadce0] px-4 text-sm"
                              />
                            </div>
                            {companyCardEditError ? (
                              <div className="mt-2 text-xs text-[#d93025]">{companyCardEditError}</div>
                            ) : null}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                type="submit"
                                disabled={companyCardEditSubmitting}
                                className="h-9 rounded-full bg-[#1a73e8] px-4 text-sm font-medium text-white disabled:opacity-60"
                              >
                                저장
                              </button>
                              <button
                                type="button"
                                className="h-9 rounded-full border border-[#dadce0] px-4 text-sm text-[#3c4043]"
                                onClick={cancelEditCompany}
                              >
                                취소
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div className="mb-4 flex items-start justify-between gap-2">
                              <div className="flex min-w-0 flex-1 items-start gap-1">
                                {handle}
                                <div className="flex min-w-0 flex-1 items-start gap-4">
                                  <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[26px] leading-none"
                                    aria-hidden
                                  >
                                    {siteTitleEmoji(site.title, "company")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h3
                                      className="truncate text-[20px] font-medium leading-tight text-[#202124]"
                                      title={site.title}
                                    >
                                      {site.title}
                                    </h3>
                                    <p className="mt-1 max-w-[180px] truncate text-sm font-normal leading-reading text-[#5f6368]">
                                      {site.domain}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              {isAdmin ? (
                                <div className="flex shrink-0 items-center gap-2 text-[#9aa0a6]">
                                  <button
                                    type="button"
                                    className="transition hover:text-[#5f6368]"
                                    aria-label="회사 고정 메뉴 수정"
                                    title="수정"
                                    onClick={() => startEditCompany(site)}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    type="button"
                                    className="transition hover:text-[#d93025]"
                                    aria-label="회사 고정 메뉴 삭제"
                                    onClick={() => void onDeleteCompany(site)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="rounded-full border border-[#dbe7fb] px-2 py-1 text-[11px] font-medium text-[#1a73e8]">
                                  LOCK
                                </div>
                              )}
                            </div>
                            <p className="min-h-[44px] flex-1 text-sm font-normal leading-reading text-[#5f6368]">
                              {site.description}
                            </p>
                            <div className="mt-auto pt-4">
                              {isTeamLeaderWorkspaceSite(site.title, site.description) ? (
                                <div className="mb-2 flex justify-start">
                                  <span
                                    className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold leading-none text-amber-900"
                                    aria-label="팀장 전용"
                                  >
                                    <span
                                      className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-200 text-[10px] leading-none text-amber-900"
                                      aria-hidden
                                    >
                                      ✓
                                    </span>
                                    팀장용
                                  </span>
                                </div>
                              ) : null}
                              <button
                                type="button"
                                data-testid={`open-${site.id}`}
                                disabled={!isLoggedIn}
                                className="h-11 w-full rounded-full bg-[#1a73e8] text-sm font-medium text-white transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => openSite(site.domain)}
                              >
                                열기
                              </button>
                            </div>
                          </>
                        )
                      }
                    </SortableItem>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          <div className="mt-10 mb-6 rounded-[24px] border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] p-5 shadow-[0_1px_2px_rgba(47,58,69,0.04)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="workspace-title">My Workspace</div>
                <p className="mt-1 text-sm font-normal leading-reading text-[var(--ws-text-sub)]">
                  직원마다 다르게 추가하는 개인 커스텀 링크 영역입니다.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span className="rounded-full border border-[var(--ws-accent)]/35 bg-[color-mix(in_srgb,var(--ws-accent)_10%,var(--ws-card-bg))] px-3 py-1 text-xs font-medium text-[var(--ws-accent)]">
                  개인 링크
                </span>
                <button
                  type="button"
                  className="h-10 rounded-full bg-[var(--ws-btn-bg)] px-4 text-sm font-medium text-[var(--ws-btn-text)] transition hover:bg-[var(--ws-accent-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ws-accent)]/35"
                  onClick={openAddPersonal}
                >
                  + 내 링크 추가
                </button>
              </div>
            </div>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPersonalDragEnd}>
            <SortableContext items={visiblePersonal.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-4">
                {visiblePersonal.map((site) => (
                  <SortableItem
                    key={site.id}
                    id={site.id}
                    sortEnabled={personalSortable}
                    className="flex h-full flex-col rounded-[24px] border border-[var(--ws-card-border)] bg-[var(--ws-card-bg)] p-5 transition hover:-translate-y-[2px] hover:shadow-[0_1px_3px_rgba(47,58,69,0.08),0_4px_12px_rgba(47,58,69,0.06)]"
                  >
                    {(handle) => (
                      <>
                        <div className="mb-4 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-1">
                            {handle}
                            <div className="flex min-w-0 flex-1 items-start gap-4">
                              <div
                                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--ws-bg)] text-[26px] leading-none"
                                aria-hidden
                              >
                                {siteTitleEmoji(site.title, "personal")}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3
                                  className="truncate text-[20px] font-medium leading-tight text-[var(--ws-text-main)]"
                                  title={site.title}
                                >
                                  {site.title}
                                </h3>
                                <p className="mt-1 max-w-[180px] truncate text-sm font-normal leading-reading text-[var(--ws-text-sub)]">
                                  {site.domain}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-2 text-[#9aa0a6]">
                            <button
                              type="button"
                              aria-label={site.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                              className={`${site.favorite ? "text-[#fbbc04]" : ""} transition hover:text-[#5f6368]`}
                              onClick={() => void onToggleFavorite(site)}
                            >
                              ★
                            </button>
                            <button
                              type="button"
                              className="transition hover:text-[#5f6368] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="내 링크 수정"
                              title="수정"
                              disabled={!isLoggedIn}
                              onClick={() => openEditPersonal(site)}
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              className="transition hover:text-[#d93025] disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="내 링크 삭제"
                              title="삭제"
                              disabled={!isLoggedIn}
                              onClick={() => void onDeletePersonal(site)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="mb-4 inline-flex rounded-full border border-[var(--ws-accent)]/30 bg-[color-mix(in_srgb,var(--ws-accent)_10%,var(--ws-card-bg))] px-3 py-1 text-xs font-medium text-[var(--ws-accent)]">
                          개인 링크
                        </div>

                        <p className="min-h-[44px] flex-1 text-sm font-normal leading-reading text-[var(--ws-text-sub)]">
                          {site.description}
                        </p>

                        <div className="mt-auto pt-4">
                          {isTeamLeaderWorkspaceSite(site.title, site.description) ? (
                            <div className="mb-2 flex justify-start">
                              <span
                                className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold leading-none text-amber-900"
                                aria-label="팀장 전용"
                              >
                                <span
                                  className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-200 text-[10px] leading-none text-amber-900"
                                  aria-hidden
                                >
                                  ✓
                                </span>
                                팀장용
                              </span>
                            </div>
                          ) : null}
                          <button
                            type="button"
                            data-testid={`open-${site.id}`}
                            disabled={!isLoggedIn}
                            className="h-11 w-full rounded-full bg-[var(--ws-btn-bg)] text-sm font-medium text-[var(--ws-btn-text)] transition hover:bg-[var(--ws-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => openSite(site.domain)}
                          >
                            열기
                          </button>
                        </div>
                      </>
                    )}
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </div>
    </div>
  );
}
