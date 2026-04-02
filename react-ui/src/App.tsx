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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FormEvent, useCallback, useEffect, useMemo, useState, type PointerEvent, type ReactNode } from "react";
import "./App.css";
import ModalDialog from "./components/ModalDialog";
import PersonalNotepadPanel from "./components/PersonalNotepadPanel";
import SupabaseEnvMissingNotice from "./components/SupabaseEnvMissingNotice";
import { mapWorkspaceSiteRows } from "./application/workspaceSites/mapWorkspaceSiteRows";
import { reorderSiteIds } from "./application/workspaceSites/reorderSiteIds";
import { isTeamLeaderWorkspaceSite } from "./application/workspaceSites/isTeamLeaderSite";
import { siteTitleEmoji } from "./application/workspaceSites/siteTitleEmoji";
import { resolveSiteUrl } from "./application/workspaceSites/resolveSiteUrl";
import {
  displayLoginIdFromEmail,
  resolveLoginEmail,
} from "./application/auth/resolveLoginEmail";
import { isEhubAdmin } from "./application/auth/isEhubAdmin";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./infrastructure/supabase";
import {
  applyCompanySitesSortOrder,
  applyPersonalSitesSortOrder,
  deleteCompanySite,
  deletePersonalSite,
  fetchWorkspaceSiteRows,
  insertCompanySite,
  insertPersonalSite,
  updateCompanySite,
  updatePersonalSite,
} from "./infrastructure/supabase/workspaceSiteRepository";
import type { CompanySite, PersonalSite } from "./domain/workspaceSite";

interface MenuCard {
  id: string;
  title: string;
  url: string;
  icon: string;
  tags: string[];
  roleTag?: string;
  locked?: boolean;
}


function parseTags(text: string): string[] {
  const matches = text.match(/#[^\s#]+/g) ?? [];
  return matches.slice(0, 6);
}

function toCompanyCard(site: CompanySite): MenuCard {
  return {
    id: site.id,
    title: site.title,
    url: site.domain,
    icon: siteTitleEmoji(site.title, "company"),
    tags: parseTags(site.description),
    roleTag: isTeamLeaderWorkspaceSite(site.title, site.description) ? "팀장용" : undefined,
    locked: true,
  };
}

function toPersonalCard(site: PersonalSite): MenuCard {
  return {
    id: site.id,
    title: site.title,
    url: site.domain,
    icon: siteTitleEmoji(site.title, "personal"),
    tags: parseTags(site.description),
  };
}

function displayHost(rawUrl: string): string {
  const resolved = resolveSiteUrl(rawUrl);
  if (!resolved.ok) return rawUrl;
  try {
    return new URL(resolved.url).hostname;
  } catch {
    return rawUrl;
  }
}

function blockParentDrag(e: PointerEvent) {
  e.stopPropagation();
}

function CardItem({
  card,
  variant = "company",
  onOpen,
  onEdit,
  onDelete,
  isolatePointerForParentDrag = false,
}: {
  card: MenuCard;
  variant?: "company" | "personal";
  onOpen: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** true면 카드 바깥(정렬 래퍼)으로 포인터 이벤트가 올라가지 않아 버튼·열기와 드래그가 충돌하지 않음 */
  isolatePointerForParentDrag?: boolean;
}) {
  const isPersonal = variant === "personal";
  const block = isolatePointerForParentDrag ? blockParentDrag : undefined;

  return (
    <div className={`card ${isPersonal ? "card-personal" : "card-company"}`}>
      <div className="card-inner">
        <div className="card-top-row">
          <div className={`card-icon ${isPersonal ? "card-icon-personal" : "card-icon-company"}`}>
            {card.icon}
          </div>
          <div className="card-controls" onPointerDown={block}>
            <button className="ctrl-btn" title="수정" onClick={onEdit}>
              ✏
            </button>
            <button className="ctrl-btn ctrl-delete" title="삭제" onClick={onDelete}>
              ✕
            </button>
            {card.locked && <span className="lock-badge">LOCK</span>}
          </div>
        </div>

        <p className="card-name">{card.title}</p>
        <p className="card-url">{displayHost(card.url)}</p>

        {card.roleTag && <span className="role-pill">{card.roleTag}</span>}

        <div className="card-tags">
          {card.tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="card-footer" onPointerDown={block}>
        <button
          className={`open-btn ${isPersonal ? "open-btn-personal" : "open-btn-company"}`}
          onClick={() => onOpen(card.url)}
        >
          열기
        </button>
      </div>
    </div>
  );
}

function SortableCardWrap({ id, sortEnabled, children }: { id: string; sortEnabled: boolean; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortEnabled,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.88 : undefined,
    zIndex: isDragging ? 15 : undefined,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={sortEnabled ? "card-drag-wrap" : undefined}
      {...(sortEnabled ? { ...listeners, ...attributes } : {})}
    >
      {children}
    </div>
  );
}

function EmptyCard({
  variant = "company",
  onClick,
}: {
  variant?: "company" | "personal";
  onClick?: () => void;
}) {
  const label = variant === "personal" ? "개인 링크 추가" : "고정 메뉴 추가";
  return (
    <div
      className={`empty-card ${variant === "personal" ? "empty-card-personal" : ""}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `${label} (카드)` : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <span className="empty-plus">+</span>
      <span className="empty-text">메뉴 추가</span>
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured(import.meta.env)) {
    return <SupabaseEnvMissingNotice />;
  }
  return <AppWithSupabase />;
}

function AppWithSupabase() {
  const [session, setSession] = useState<Session | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [companySites, setCompanySites] = useState<CompanySite[]>([]);
  const [personalSites, setPersonalSites] = useState<PersonalSite[]>([]);
  const [sitesLoading, setSitesLoading] = useState(false);

  const [search, setSearch] = useState("");

  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showPersonalModal, setShowPersonalModal] = useState(false);
  const [companyEditingId, setCompanyEditingId] = useState<string | null>(null);
  const [personalEditingId, setPersonalEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDomain, setFormDomain] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const [showPersonalNotepad, setShowPersonalNotepad] = useState(false);

  const isLoggedIn = session !== null;
  const isAdmin = isEhubAdmin(session?.user ?? null);

  const headerLoginId = useMemo(
    () => displayLoginIdFromEmail(session?.user.email, import.meta.env.VITE_LOGIN_EMAIL_DOMAIN),
    [session],
  );

  const loadSites = useCallback(async (userId: string | null) => {
    setSitesLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const rows = await fetchWorkspaceSiteRows(supabase, userId);
      const mapped = mapWorkspaceSiteRows(rows);
      setCompanySites(mapped.company);
      setPersonalSites(mapped.personal);
    } finally {
      setSitesLoading(false);
    }
  }, []);

  const companySearchActive = search.trim().length > 0;
  const companySortEnabled = isAdmin && !companySearchActive;
  const personalSortEnabled = isLoggedIn;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onCompanyDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!companySortEnabled || !session?.user?.id) return;
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
    [companySortEnabled, session?.user?.id, companySites, loadSites],
  );

  const onPersonalDragEnd = useCallback(
    (e: DragEndEvent) => {
      if (!personalSortEnabled || !session?.user?.id) return;
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
    [personalSortEnabled, session?.user?.id, personalSites, loadSites],
  );

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

  useEffect(() => {
    void loadSites(session?.user.id ?? null);
  }, [session?.user.id, loadSites]);

  async function onLoginSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginError(null);
    if (!loginPassword.trim()) {
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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginPassword.trim(),
      });
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
    setShowPersonalNotepad(false);
  }

  function onOpen(url: string) {
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
    setCompanyEditingId(null);
    setFormTitle("");
    setFormDomain("");
    setFormDesc("");
    setFormError(null);
    setShowCompanyModal(true);
  }

  function openEditCompany(site: CompanySite) {
    if (!isAdmin) return;
    setCompanyEditingId(site.id);
    setFormTitle(site.title);
    setFormDomain(site.domain);
    setFormDesc(site.description);
    setFormError(null);
    setShowCompanyModal(true);
  }

  function openAddPersonal() {
    if (!session?.user.id) return;
    setPersonalEditingId(null);
    setFormTitle("");
    setFormDomain("");
    setFormDesc("");
    setFormError(null);
    setShowPersonalModal(true);
  }

  function openEditPersonal(site: PersonalSite) {
    if (!session?.user.id) return;
    setPersonalEditingId(site.id);
    setFormTitle(site.title);
    setFormDomain(site.domain);
    setFormDesc(site.description);
    setFormError(null);
    setShowPersonalModal(true);
  }

  async function onSaveCompany(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isAdmin || !session?.user.id) return;
    const title = formTitle.trim();
    const domain = formDomain.trim();
    if (!title || !domain) {
      setFormError("제목과 도메인을 입력해 주세요.");
      return;
    }
    const urlOk = resolveSiteUrl(domain);
    if (!urlOk.ok) {
      setFormError(urlOk.message);
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (companyEditingId) {
        await updateCompanySite(supabase, companyEditingId, {
          title,
          domain,
          description: formDesc.trim(),
          category: "회사 고정",
        });
      } else {
        await insertCompanySite(supabase, {
          title,
          domain,
          description: formDesc.trim(),
          category: "회사 고정",
        });
      }
      setShowCompanyModal(false);
      await loadSites(session.user.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function onSavePersonal(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!session?.user.id) return;
    const title = formTitle.trim();
    const domain = formDomain.trim();
    if (!title || !domain) {
      setFormError("제목과 도메인을 입력해 주세요.");
      return;
    }
    const urlOk = resolveSiteUrl(domain);
    if (!urlOk.ok) {
      setFormError(urlOk.message);
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      if (personalEditingId) {
        await updatePersonalSite(supabase, session.user.id, personalEditingId, {
          title,
          domain,
          description: formDesc.trim(),
          category: "개인",
        });
      } else {
        await insertPersonalSite(supabase, session.user.id, {
          title,
          domain,
          description: formDesc.trim(),
          category: "개인",
        });
      }
      setShowPersonalModal(false);
      await loadSites(session.user.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "저장하지 못했습니다.");
    } finally {
      setFormSubmitting(false);
    }
  }

  async function onDeleteCompany(site: CompanySite) {
    if (!isAdmin || !session?.user.id) return;
    if (!window.confirm(`「${site.title}」를 삭제할까요?`)) return;
    const supabase = getSupabaseBrowserClient();
    await deleteCompanySite(supabase, site.id);
    await loadSites(session.user.id);
  }

  async function onDeletePersonal(site: PersonalSite) {
    if (!session?.user.id) return;
    if (!window.confirm(`「${site.title}」를 삭제할까요?`)) return;
    const supabase = getSupabaseBrowserClient();
    await deletePersonalSite(supabase, site.id);
    await loadSites(session.user.id);
  }

  const companyCards = companySites.map(toCompanyCard);
  const filteredCompany = companyCards.filter((card) => {
    const q = search.toLowerCase();
    return !q || card.title.toLowerCase().includes(q) || card.tags.some((t) => t.toLowerCase().includes(q));
  });
  const personalCards = personalSites.map(toPersonalCard);

  return (
    <div className="workspace">
      <div className="hero">
        <div>
          <div className="hero-badge">SBS M&amp;C WORK HUB</div>
          <h1 className="hero-title">
            사내 주요 서비스와 <em>개인 워크스페이스</em>를 한곳에
          </h1>
          <p className="hero-desc">
            공통 메뉴는 안정적으로 유지하고, 개인 링크는 더 유연하고 세련되게 관리하는 대시보드형 관리 사이트.
          </p>
        </div>
        <div className="hero-right">
          {isLoggedIn ? (
            <>
              <span className="meta-btn meta-id">ID: {headerLoginId || "로그인됨"}</span>
              {isAdmin ? <button className="meta-btn">관리자</button> : null}
              <button
                className="meta-btn"
                type="button"
                onClick={() => setShowPersonalNotepad((v) => !v)}
              >
                {showPersonalNotepad ? "메모장 닫기" : "+ 메모장 열기"}
              </button>
              <button className="meta-btn meta-logout" onClick={() => void onLogout()}>
                로그아웃
              </button>
            </>
          ) : (
            <form className="hero-right" onSubmit={(e) => void onLoginSubmit(e)}>
              <input className="meta-btn" placeholder="ID" value={loginId} onChange={(e) => setLoginId(e.target.value)} />
              <input
                className="meta-btn"
                placeholder="비밀번호"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
              />
              <button className="meta-btn" type="submit" disabled={loginSubmitting}>
                로그인
              </button>
            </form>
          )}
          {loginError ? <div className="section-sub">{loginError}</div> : null}
        </div>
      </div>

      <ModalDialog
        open={showPersonalNotepad}
        onClose={() => setShowPersonalNotepad(false)}
        titleId="app-personal-notepad-title"
      >
        <div id="app-personal-notepad-title" className="section-title">
          개인 메모장
        </div>
        <div style={{ marginTop: 10 }}>
          <PersonalNotepadPanel userId={session?.user.id ?? null} />
        </div>
      </ModalDialog>

      <div className="section-wrap">
        <div className="section-header">
          <div>
            <div className="section-kicker">
              COMPANY AREA
            </div>
            <div className="section-title-row">
              <h2 className="section-title">
                Company <em>Workspace</em>
              </h2>
              <span className="count-pill">{companyCards.length}</span>
            </div>
            <p className="section-sub">
              관리자가 고정하는 전사 공통 메뉴입니다. 개인 사용자는 순서 변경이 불가합니다.
            </p>
          </div>
          <div className="header-btns">
            <button className="hb">고정 메뉴</button>
            {isAdmin ? (
              <button className="hb hb-primary" onClick={openAddCompany}>
                + 고정 메뉴 추가
              </button>
            ) : null}
          </div>
        </div>

        <div className="toolbar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              placeholder="메뉴 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card-grid">
          {sitesLoading ? <div className="section-sub">불러오는 중...</div> : null}
          {companySortEnabled ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onCompanyDragEnd}>
              <SortableContext items={companySites.map((s) => s.id)} strategy={rectSortingStrategy}>
                {companySites.map((site) => {
                  const card = toCompanyCard(site);
                  return (
                    <SortableCardWrap key={site.id} id={site.id} sortEnabled>
                      <CardItem
                        card={card}
                        variant="company"
                        onOpen={onOpen}
                        onEdit={() => openEditCompany(site)}
                        onDelete={() => void onDeleteCompany(site)}
                        isolatePointerForParentDrag
                      />
                    </SortableCardWrap>
                  );
                })}
              </SortableContext>
              {isAdmin ? <EmptyCard variant="company" onClick={openAddCompany} /> : null}
            </DndContext>
          ) : (
            <>
              {filteredCompany.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  variant="company"
                  onOpen={onOpen}
                  onEdit={() => openEditCompany(companySites.find((s) => s.id === card.id)!)}
                  onDelete={() => void onDeleteCompany(companySites.find((s) => s.id === card.id)!)}
                />
              ))}
              {isAdmin ? <EmptyCard variant="company" onClick={openAddCompany} /> : null}
            </>
          )}
        </div>
      </div>

      <div className="section-wrap section-personal">
        <div className="section-header">
          <div>
            <div className="section-kicker section-kicker-personal">
              PERSONAL AREA
            </div>
            <div className="section-title-row">
              <h2 className="section-title section-title-personal">
                My <em>Workspace</em>
              </h2>
              <span className="count-pill count-pill-personal">{personalCards.length}</span>
            </div>
            <p className="section-sub">직원마다 다르게 추가하는 개인 커스텀 링크 영역입니다.</p>
          </div>
          <div className="header-btns">
            <button className="hb">개인 링크</button>
            <button className="hb hb-green" onClick={openAddPersonal} disabled={!isLoggedIn}>
              + 새 링크 추가
            </button>
          </div>
        </div>

        <div className="card-grid" style={{ padding: "18px 24px 24px" }}>
          {personalSortEnabled ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onPersonalDragEnd}>
              <SortableContext items={personalSites.map((s) => s.id)} strategy={rectSortingStrategy}>
                {personalSites.map((site) => {
                  const card = toPersonalCard(site);
                  return (
                    <SortableCardWrap key={site.id} id={site.id} sortEnabled>
                      <CardItem
                        card={card}
                        variant="personal"
                        onOpen={onOpen}
                        onEdit={() => openEditPersonal(site)}
                        onDelete={() => void onDeletePersonal(site)}
                        isolatePointerForParentDrag
                      />
                    </SortableCardWrap>
                  );
                })}
              </SortableContext>
              <EmptyCard variant="personal" onClick={openAddPersonal} />
            </DndContext>
          ) : (
            <>
              {personalCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  variant="personal"
                  onOpen={onOpen}
                  onEdit={() => openEditPersonal(personalSites.find((s) => s.id === card.id)!)}
                  onDelete={() => void onDeletePersonal(personalSites.find((s) => s.id === card.id)!)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      <ModalDialog
        open={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        titleId="app-company-modal-title"
      >
        <form onSubmit={(e) => void onSaveCompany(e)}>
          <div id="app-company-modal-title" className="section-title">
            {companyEditingId ? "고정 메뉴 수정" : "고정 메뉴 추가"}
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input
              className="search-input"
              placeholder="제목"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="도메인"
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="설명"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            {formError ? <div className="section-sub">{formError}</div> : null}
            <button className="hb hb-primary" type="submit" disabled={formSubmitting}>
              저장
            </button>
          </div>
        </form>
      </ModalDialog>

      <ModalDialog
        open={showPersonalModal}
        onClose={() => setShowPersonalModal(false)}
        titleId="app-personal-modal-title"
      >
        <form onSubmit={(e) => void onSavePersonal(e)}>
          <div id="app-personal-modal-title" className="section-title">
            {personalEditingId ? "개인 링크 수정" : "개인 링크 추가"}
          </div>
          <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
            <input
              className="search-input"
              placeholder="제목"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="도메인"
              value={formDomain}
              onChange={(e) => setFormDomain(e.target.value)}
            />
            <input
              className="search-input"
              placeholder="설명"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            {formError ? <div className="section-sub">{formError}</div> : null}
            <button className="hb hb-green" type="submit" disabled={formSubmitting}>
              저장
            </button>
          </div>
        </form>
      </ModalDialog>
    </div>
  );
}

