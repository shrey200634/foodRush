import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Clock, TrendingUp, Flame, Search as SearchIcon, ChefHat } from "lucide-react";
import { useRestaurantStore } from "../store/restaurantStore";
import { useAuthStore } from "../store/authStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_FAINT = "rgba(43,29,18,0.14)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const SAFFRON = "#D98B3E";
const PISTACHIO = "#6B7F4A";
const CURRY = "#B5761A";

const CUISINE_FILTERS = [
  "All", "North Indian", "South Indian", "Chinese", "Italian", "Continental", "Desserts", "Biryani",
];

// Fallback palette for when image fails to load
const palettes = [
  { bg: "#F9DDC5", accent: TERRACOTTA },
  { bg: "#F4D9B8", accent: SAFFRON },
  { bg: "#E8D9BA", accent: CURRY },
  { bg: "#DCE4C8", accent: PISTACHIO },
  { bg: "#F5CFC3", accent: TERRACOTTA_DEEP },
];
const paletteFor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return palettes[h % palettes.length];
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { topRated, nearby, loading, fetchTopRated, fetchNearby } = useRestaurantStore();
  const [cuisine, setCuisine] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchTopRated();
    fetchNearby();
  }, []);

  const all = useMemo(() => {
    const map = new Map();
    [...topRated, ...nearby].forEach((r) => map.set(r.restaurantId, r));
    return Array.from(map.values());
  }, [topRated, nearby]);

  const featured = topRated[0];
  const otherRestaurants = useMemo(() => {
    return all.filter((r) => r.restaurantId !== featured?.restaurantId);
  }, [all, featured]);

  const filtered = useMemo(() => {
    return cuisine === "All" ? otherRestaurants : otherRestaurants.filter((r) => r.cuisineType === cuisine);
  }, [otherRestaurants, cuisine]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div style={{ paddingBottom: 80, animation: "fade-up 0.5s cubic-bezier(0.2,0.8,0.2,1) both", position: "relative" }}>
      <div style={{
        position: "absolute", top: -80, right: -120,
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${TERRACOTTA_SOFT}18 0%, transparent 60%)`,
        filter: "blur(60px)", pointerEvents: "none", zIndex: -1,
      }} />

      {/* Greeting */}
      <section style={{ marginBottom: 36 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "6px 14px", borderRadius: 999,
          background: `${TERRACOTTA}0E`, border: `1px solid ${TERRACOTTA}28`,
          marginBottom: 20,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: TERRACOTTA,
            animation: "pulse-dot 2s ease-in-out infinite",
          }} />
          <span style={{
            fontSize: "0.7rem", color: TERRACOTTA_DEEP,
            textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 600,
          }}>Delivering to your area</span>
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(2.4rem, 5vw, 3.6rem)",
          fontWeight: 400, lineHeight: 1, letterSpacing: "-0.03em",
          color: INK, marginBottom: 8,
        }}>
          Good {greeting},{" "}
          <span style={{
            fontStyle: "italic",
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA}, ${TERRACOTTA_DEEP})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>{user?.name?.split(" ")[0] || "friend"}</span>
        </h1>
        <p style={{ fontSize: "1.05rem", color: INK_SOFT, maxWidth: 560 }}>
          What's calling you tonight? Biryani, crispy dosa, or something new?
        </p>
      </section>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ marginBottom: 40 }}>
        <div style={{ position: "relative", maxWidth: 640 }}>
          <SearchIcon size={20} style={{
            position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)",
            color: INK_MUTED, pointerEvents: "none",
          }} />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for dishes, cuisines, or restaurants..."
            style={{
              width: "100%", padding: "18px 20px 18px 54px",
              background: CARD, border: `1.5px solid ${INK_HAIR}`,
              borderRadius: 16, fontSize: "1rem", fontFamily: "var(--font-sans)",
              color: INK, outline: "none", transition: "all 0.25s",
              boxShadow: `0 2px 8px ${INK_HAIR}`,
            }}
            onFocus={(e) => { e.target.style.borderColor = TERRACOTTA; e.target.style.boxShadow = `0 0 0 4px ${TERRACOTTA}15`; }}
            onBlur={(e) => { e.target.style.borderColor = INK_HAIR; e.target.style.boxShadow = `0 2px 8px ${INK_HAIR}`; }}
          />
        </div>
      </form>

      {/* Cuisines */}
      <section style={{ marginBottom: 44 }}>
        <div style={{
          fontSize: "0.72rem", color: INK_MUTED,
          textTransform: "uppercase", letterSpacing: "0.12em",
          fontWeight: 600, marginBottom: 14,
        }}>Browse by cuisine</div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
          {CUISINE_FILTERS.map((c) => {
            const active = cuisine === c;
            return (
              <button key={c} onClick={() => setCuisine(c)} style={{
                padding: "9px 18px", borderRadius: 999, whiteSpace: "nowrap",
                border: `1.5px solid ${active ? TERRACOTTA : INK_HAIR}`,
                background: active ? TERRACOTTA : CARD,
                color: active ? "#FFF5E6" : INK_SOFT,
                fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                fontWeight: active ? 600 : 500, cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: active ? `0 4px 12px ${TERRACOTTA}35` : "none",
              }}>{c}</button>
            );
          })}
        </div>
      </section>

      {/* Featured hero card */}
      {featured && <FeaturedCard restaurant={featured} onClick={() => navigate(`/restaurants/${featured.restaurantId}`)} />}

      {/* Section: Popular near you */}
      <section style={{ marginTop: 56 }}>
        <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <TrendingUp size={18} style={{ color: TERRACOTTA }} />
          <h2 style={{
            fontFamily: "var(--font-display)", fontSize: "1.7rem",
            fontWeight: 500, letterSpacing: "-0.02em", color: INK,
          }}>Popular near you</h2>
        </div>

        {loading && filtered.length === 0 ? (
          <GridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState cuisine={cuisine} />
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 22,
          }}>
            {filtered.map((r, i) => (
              <RestaurantCard
                key={r.restaurantId} restaurant={r} index={i}
                onClick={() => navigate(`/restaurants/${r.restaurantId}`)}
              />
            ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes fade-up { from { opacity:0; transform:translateY(24px);} to { opacity:1; transform:translateY(0);} }
        @keyframes pulse-dot { 0%,100% { opacity:1; box-shadow: 0 0 0 0 ${TERRACOTTA}99; } 50% { opacity:0.7; box-shadow: 0 0 0 6px ${TERRACOTTA}00; } }
        @keyframes shimmer { 0%{ background-position: -200% 0;} 100%{ background-position: 200% 0;} }
      `}</style>
    </div>
  );
}

// ────── Featured hero ──────
function FeaturedCard({ restaurant, onClick }) {
  const r = restaurant;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const palette = paletteFor(r.name);

  return (
    <div onClick={onClick} style={{
      display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 0,
      background: CARD, borderRadius: 24,
      border: `1px solid ${INK_HAIR}`, overflow: "hidden", cursor: "pointer",
      boxShadow: `0 2px 4px ${INK_HAIR}, 0 24px 50px -20px rgba(43,29,18,0.16)`,
      transition: "all 0.3s cubic-bezier(0.2,0.8,0.2,1)",
      animation: "fade-up 0.6s ease-out 0.1s both",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 2px 4px ${INK_HAIR}, 0 32px 64px -20px rgba(43,29,18,0.22)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 2px 4px ${INK_HAIR}, 0 24px 50px -20px rgba(43,29,18,0.16)`; }}
    >
      {/* Left - content */}
      <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 12px", borderRadius: 999,
            background: `${TERRACOTTA}12`, color: TERRACOTTA_DEEP,
            fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 18,
          }}>
            <Flame size={11} /> Editor's pick
          </div>

          <h3 style={{
            fontFamily: "var(--font-display)", fontSize: "2.4rem",
            fontWeight: 500, lineHeight: 1.05, letterSpacing: "-0.02em",
            color: INK, marginBottom: 10,
          }}>{r.name}</h3>

          <p style={{
            fontSize: "0.95rem", color: INK_SOFT,
            lineHeight: 1.55, marginBottom: 24, maxWidth: 420,
          }}>{r.description || `Authentic ${r.cuisineType} flavors crafted with care.`}</p>

          <div style={{ display: "flex", gap: 22, flexWrap: "wrap", marginBottom: 28 }}>
            <Metric icon={Star} value={r.avgRating > 0 ? Number(r.avgRating).toFixed(1) : "New"} label="Rating" color={CURRY} filled />
            <Metric icon={Clock} value={`${r.avgDeliveryTimeMins || 30}`} suffix="min" label="Delivery" color={SAFFRON} />
            <Metric value={r.cuisineType} label="Cuisine" color={PISTACHIO} textOnly />
          </div>
        </div>

        <button style={{
          alignSelf: "flex-start",
          padding: "12px 24px", borderRadius: 12, border: "none",
          background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
          color: "#FFF5E6", fontSize: "0.9rem", fontWeight: 600,
          fontFamily: "var(--font-sans)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
          boxShadow: `0 6px 18px ${TERRACOTTA}45`,
        }}>
          View menu <span style={{ fontSize: "1.1rem" }}>→</span>
        </button>
      </div>

      {/* Right - real image or fallback */}
      <div style={{
        position: "relative", minHeight: 340,
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.accent}30 100%)`,
        overflow: "hidden",
      }}>
        {r.imageUrl && !imgError && (
          <img
            src={r.imageUrl}
            alt={r.name}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.5s",
            }}
          />
        )}
        {/* Fallback */}
        {(!r.imageUrl || imgError) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "13rem",
              fontWeight: 500, color: palette.accent,
              lineHeight: 0.8, fontStyle: "italic", opacity: 0.85,
            }}>{r.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}
        {/* Image overlay gradient for text readability */}
        {r.imageUrl && !imgError && (
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(43,29,18,0.5) 100%)",
          }} />
        )}
        <div style={{
          position: "absolute", bottom: 20, left: 20,
          fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: r.imageUrl && !imgError ? "#FFF5E6" : palette.accent,
          opacity: 0.85,
        }}>— Featured this week</div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, value, suffix, label, color, filled, textOnly }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 10,
        background: `${color}15`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {Icon ? <Icon size={15} style={{ color }} fill={filled ? color : "none"} /> :
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />
        }
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
          <span style={{
            fontFamily: textOnly ? "var(--font-sans)" : "var(--font-display)",
            fontSize: textOnly ? "0.95rem" : "1.1rem",
            fontWeight: textOnly ? 600 : 500,
            color: INK, lineHeight: 1,
          }}>{value}</span>
          {suffix && <span style={{ fontSize: "0.75rem", color, fontWeight: 600 }}>{suffix}</span>}
        </div>
        <div style={{ fontSize: "0.68rem", color: INK_MUTED, marginTop: 3, letterSpacing: "0.03em", fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

// ────── Restaurant card ──────
function RestaurantCard({ restaurant, index, onClick }) {
  const r = restaurant;
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const palette = paletteFor(r.name);

  return (
    <div onClick={onClick} style={{
      background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
      overflow: "hidden", cursor: "pointer",
      transition: "all 0.25s cubic-bezier(0.2,0.8,0.2,1)",
      animation: `fade-up 0.4s ease-out ${index * 0.05}s both`,
      boxShadow: `0 1px 2px ${INK_HAIR}`,
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = `0 1px 2px ${INK_HAIR}, 0 20px 40px -12px rgba(43,29,18,0.18)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = `0 1px 2px ${INK_HAIR}`;
      }}
    >
      {/* Image */}
      <div style={{
        height: 180, position: "relative",
        background: `linear-gradient(135deg, ${palette.bg} 0%, ${palette.accent}25 100%)`,
        overflow: "hidden",
      }}>
        {r.imageUrl && !imgError ? (
          <>
            {!imgLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(90deg, ${palette.bg} 0%, ${palette.accent}20 50%, ${palette.bg} 100%)`,
                backgroundSize: "200% 100%",
                animation: "shimmer 1.5s infinite",
              }} />
            )}
            <img
              src={r.imageUrl} alt={r.name}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                opacity: imgLoaded ? 1 : 0, transition: "opacity 0.4s",
              }}
            />
          </>
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: "6rem",
              fontWeight: 500, color: palette.accent,
              fontStyle: "italic", opacity: 0.85,
            }}>{r.name?.charAt(0)?.toUpperCase()}</span>
          </div>
        )}

        {/* Closed overlay */}
        {r.isOpen === false && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(43,29,18,0.6)", backdropFilter: "blur(3px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#FFF5E6", fontSize: "0.85rem", fontWeight: 600,
            letterSpacing: "0.05em", textTransform: "uppercase",
          }}>Currently closed</div>
        )}

        {/* Rating pill */}
        {r.avgRating > 0 && (
          <div style={{
            position: "absolute", top: 12, right: 12,
            padding: "4px 10px", borderRadius: 999,
            background: "rgba(255, 250, 240, 0.95)", color: INK,
            fontSize: "0.78rem", fontWeight: 700,
            display: "flex", alignItems: "center", gap: 4,
            boxShadow: "0 2px 8px rgba(43,29,18,0.2)",
            backdropFilter: "blur(8px)",
          }}>
            <Star size={11} fill={CURRY} color={CURRY} /> {Number(r.avgRating).toFixed(1)}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px 20px" }}>
        <h3 style={{
          fontSize: "1.05rem", fontWeight: 700, color: INK, marginBottom: 4,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{r.name}</h3>
        <p style={{
          fontSize: "0.82rem", color: INK_MUTED, marginBottom: 14,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{r.cuisineType} · {r.address?.split(",")[0] || "Nearby"}</p>

        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          paddingTop: 12, borderTop: `1px solid ${INK_HAIR}`,
          fontSize: "0.78rem", color: INK_SOFT,
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} /> {r.avgDeliveryTimeMins || 30} min
          </span>
          {r.minOrderAmount > 0 && <span style={{ color: INK_MUTED }}>· Min ₹{r.minOrderAmount}</span>}
          {r.totalReviews > 0 && (
            <span style={{ marginLeft: "auto", color: INK_MUTED, fontSize: "0.72rem" }}>{r.totalReviews} reviews</span>
          )}
        </div>
      </div>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 22 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{ background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`, overflow: "hidden" }}>
          <div style={{
            height: 180, background: `linear-gradient(90deg, ${FIELD} 0%, ${INK_HAIR} 50%, ${FIELD} 100%)`,
            backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite",
          }} />
          <div style={{ padding: 20 }}>
            <div style={{ height: 16, width: "60%", background: FIELD, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 12, width: "40%", background: FIELD, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ cuisine }) {
  return (
    <div style={{
      padding: "64px 24px", textAlign: "center",
      background: CARD, borderRadius: 16, border: `1.5px dashed ${INK_HAIR}`,
    }}>
      <ChefHat size={40} style={{ color: INK_MUTED, margin: "0 auto 16px", display: "block" }} />
      <h3 style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: 6, color: INK }}>
        No {cuisine === "All" ? "restaurants" : `${cuisine} spots`} nearby yet
      </h3>
      <p style={{ fontSize: "0.9rem", color: INK_SOFT, maxWidth: 360, margin: "0 auto" }}>
        Try a different cuisine or check back soon.
      </p>
    </div>
  );
}
