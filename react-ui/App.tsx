import { useState } from "react";
import "./App.css";

// ── Types ──────────────────────────────────────────────
interface MenuCard {
  id: string;
  title: string;
  url: string;
  icon: string;
  tags: string[];
  roleTag?: string;
  locked?: boolean;
}

// ── Data ───────────────────────────────────────────────
const COMPANY_MENUS: MenuCard[] = [
  {
    id: "1",
    title: "코칭/리뷰 시스템",
    url: "https://sbsmc-team-review.vercel.app/",
    icon: "🛡",
    tags: ["#코칭", "#리뷰", "#과정관리"],
    roleTag: "팀장용",
    locked: true,
  },
  {
    id: "2",
    title: "나눔 마켓",
    url: "https://sbsmcanabada.vercel.app/",
    icon: "🛒",
    tags: ["#나눔", "#아나바다"],
    locked: true,
  },
  {
    id: "3",
    title: "사무용품 신청",
    url: "https://mc-purchase.vercel.app/login",
    icon: "🏛",
    tags: ["#사무용품", "#개인신청"],
    locked: true,
  },
  {
    id: "4",
    title: "사옥이전 안내",
    url: "https://pdfview-one.vercel.app/",
    icon: "🏢",
    tags: ["#목동", "#사옥이전"],
    locked: true,
  },
];

const PERSONAL_MENUS: MenuCard[] = [
  {
    id: "p1",
    title: "클로드",
    url: "https://claude.ai/new",
    icon: "🎯",
    tags: ["#클로드"],
  },
  {
    id: "p2",
    title: "망보보드",
    url: "https://www.mangoboard.net/index.do",
    icon: "🎙",
    tags: ["#디자인제작"],
  },
  {
    id: "p3",
    title: "HRD 블로그",
    url: "https://m.blog.naver.com/PostList.naver",
    icon: "👥",
    tags: ["#HR기사", "#HR공유"],
  },
];

const FILTER_TABS = ["전체", "팀장용", "코칭", "구매", "안내"];

// ── Card Component ─────────────────────────────────────
function CardItem({
  card,
  variant = "company",
}: {
  card: MenuCard;
  variant?: "company" | "personal";
}) {
  const isPersonal = variant === "personal";
  const hostname = (() => {
    try {
      return new URL(card.url).hostname;
    } catch {
      return card.url;
    }
  })();

  return (
    <div className={`card ${isPersonal ? "card-personal" : "card-company"}`}>
      <div className="card-inner">
        <div className="card-top-row">
          <div className={`card-icon ${isPersonal ? "card-icon-personal" : "card-icon-company"}`}>
            {card.icon}
          </div>
          <div className="card-controls">
            <button className="ctrl-btn" title="수정">✏</button>
            <button className="ctrl-btn ctrl-delete" title="삭제">✕</button>
            {card.locked && <span className="lock-badge">LOCK</span>}
          </div>
        </div>

        <p className="card-name">{card.title}</p>
        <p className="card-url">{hostname}</p>

        {card.roleTag && (
          <span className="role-pill">{card.roleTag}</span>
        )}

        <div className="card-tags">
          {card.tags.map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      <div className="card-footer">
        <button
          className={`open-btn ${isPersonal ? "open-btn-personal" : "open-btn-company"}`}
          onClick={() => window.open(card.url, "_blank")}
        >
          열기
        </button>
      </div>
    </div>
  );
}

// ── Empty Card ─────────────────────────────────────────
function EmptyCard({ variant = "company" }: { variant?: "company" | "personal" }) {
  return (
    <div className={`empty-card ${variant === "personal" ? "empty-card-personal" : ""}`}>
      <span className="empty-plus">+</span>
      <span className="empty-text">메뉴 추가</span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────
export default function App() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("전체");

  const filteredCompany = COMPANY_MENUS.filter((card) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      card.title.toLowerCase().includes(q) ||
      card.tags.some((t) => t.toLowerCase().includes(q));
    const matchFilter =
      activeFilter === "전체" ||
      card.roleTag === activeFilter ||
      card.tags.some((t) => t.includes(activeFilter));
    return matchSearch && matchFilter;
  });

  return (
    <div className="workspace">

      {/* ── Hero ── */}
      <div className="hero">
        <div>
          <div className="hero-badge">
            <span className="badge-dot" />
            SBS M&amp;C WORK HUB
          </div>
          <h1 className="hero-title">
            사내 주요 서비스와 <em>개인 워크스페이스</em>를 한곳에
          </h1>
          <p className="hero-desc">
            공통 메뉴는 안정적으로 유지하고, 개인 링크는 더 유연하고 세련되게 관리하는 대시보드형 관리 사이트.
          </p>
        </div>
        <div className="hero-right">
          <span className="meta-btn meta-id">ID: 120032</span>
          <button className="meta-btn">관리자</button>
          <button className="meta-btn">+ 에모장 변기</button>
          <button className="meta-btn meta-logout">로그아웃</button>
        </div>
      </div>

      {/* ── Company Workspace ── */}
      <div className="section-wrap">
        <div className="section-header">
          <div>
            <div className="section-kicker">
              <span className="kicker-dot" />
              COMPANY
            </div>
            <div className="section-title-row">
              <h2 className="section-title">
                Company <em>Workspace</em>
              </h2>
              <span className="count-pill">{COMPANY_MENUS.length}</span>
            </div>
            <p className="section-sub">
              관리자가 고정하는 전사 공통 메뉴입니다. 개인 사용자는 순서 변경이 불가합니다.
            </p>
          </div>
          <div className="header-btns">
            <button className="hb">고정 메뉴</button>
            <button className="hb hb-primary">+ 고정 메뉴 추가</button>
          </div>
        </div>

        {/* Toolbar */}
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
          <div className="filter-row">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                className={`filter-btn ${activeFilter === tab ? "filter-btn-active" : ""}`}
                onClick={() => setActiveFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="card-grid">
          {filteredCompany.map((card) => (
            <CardItem key={card.id} card={card} variant="company" />
          ))}
          <EmptyCard variant="company" />
        </div>
      </div>

      {/* ── Personal Workspace ── */}
      <div className="section-wrap section-personal">
        <div className="section-header">
          <div>
            <div className="section-kicker section-kicker-personal">
              <span className="kicker-dot kicker-dot-personal" />
              PERSONAL AREA
            </div>
            <div className="section-title-row">
              <h2 className="section-title section-title-personal">
                My <em>Workspace</em>
              </h2>
              <span className="count-pill count-pill-personal">{PERSONAL_MENUS.length}</span>
            </div>
            <p className="section-sub">직원마다 다르게 추가하는 개인 커스텀 링크 영역입니다.</p>
          </div>
          <div className="header-btns">
            <button className="hb">개인 링크</button>
            <button className="hb hb-green">+ 새 링크 추가</button>
          </div>
        </div>

        <div className="card-grid" style={{ padding: "18px 24px 24px" }}>
          {PERSONAL_MENUS.map((card) => (
            <CardItem key={card.id} card={card} variant="personal" />
          ))}
          <EmptyCard variant="personal" />
        </div>
      </div>

    </div>
  );
}
