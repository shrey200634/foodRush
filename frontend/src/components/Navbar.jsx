import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, MapPin, ChevronDown, Search } from "lucide-react";
import { useAuthStore } from "../store/authStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(250,243,231,0.88)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderBottom: `1px solid ${INK_HAIR}`,
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto", padding: "0 24px",
        height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24,
      }}>
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 60%, ${TERRACOTTA_DEEP})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700,
            color: "#FFF5E6", fontStyle: "italic",
            boxShadow: `0 4px 12px ${TERRACOTTA}35`,
          }}>f</div>
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: INK, letterSpacing: "-0.01em" }}>
            foodrush<span style={{ color: TERRACOTTA }}>.</span>
          </span>
        </Link>

        <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 420, position: "relative" }}>
          <Search size={17} style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: INK_MUTED, pointerEvents: "none",
          }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants or dishes..."
            style={{
              width: "100%", padding: "10px 16px 10px 42px",
              borderRadius: 999, border: `1.5px solid ${INK_HAIR}`,
              background: FIELD, fontSize: "0.88rem", fontFamily: "var(--font-sans)",
              color: INK, outline: "none", transition: "all 0.2s",
            }}
            onFocus={(e) => { e.target.style.borderColor = TERRACOTTA; e.target.style.background = "#FFF"; e.target.style.boxShadow = `0 0 0 3px ${TERRACOTTA}15`; }}
            onBlur={(e) => { e.target.style.borderColor = INK_HAIR; e.target.style.background = FIELD; e.target.style.boxShadow = "none"; }}
          />
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 7, padding: "8px 16px",
            borderRadius: 999, border: "none",
            background: `${TERRACOTTA}0E`, color: TERRACOTTA_DEEP,
            cursor: "pointer", fontFamily: "var(--font-sans)",
            fontSize: "0.85rem", fontWeight: 600, transition: "all 0.2s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${TERRACOTTA}18`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = `${TERRACOTTA}0E`)}
          >
            <ShoppingBag size={16} /> Cart
          </button>

          <div ref={menuRef} style={{ position: "relative" }}>
            <button onClick={() => setMenuOpen(!menuOpen)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 5px",
              borderRadius: 999, border: `1.5px solid ${INK_HAIR}`,
              background: CARD, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.2s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = TERRACOTTA_SOFT)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = INK_HAIR)}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF5E6", fontSize: "0.78rem", fontWeight: 700,
              }}>{user?.name?.charAt(0)?.toUpperCase() || "U"}</div>
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: INK, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name?.split(" ")[0] || "User"}
              </span>
              <ChevronDown size={13} style={{ color: INK_MUTED, transition: "transform 0.2s", transform: menuOpen ? "rotate(180deg)" : "rotate(0)" }} />
            </button>

            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 8px)", width: 220,
                background: "#FFFAF0", borderRadius: 14, border: `1px solid ${INK_HAIR}`,
                boxShadow: "0 14px 40px rgba(43,29,18,0.12)", padding: 6,
                animation: "scale-in 0.15s ease-out",
              }}>
                {[
                  { to: "/profile", icon: User, label: "My Profile" },
                  { to: "/addresses", icon: MapPin, label: "Addresses" },
                ].map((item) => (
                  <Link key={item.to} to={item.to} onClick={() => setMenuOpen(false)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                    borderRadius: 10, textDecoration: "none", color: INK,
                    fontSize: "0.88rem", fontWeight: 500, transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = FIELD)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <item.icon size={15} style={{ color: INK_MUTED }} /> {item.label}
                  </Link>
                ))}
                <div style={{ height: 1, background: INK_HAIR, margin: "4px 0" }} />
                <button onClick={handleLogout} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  borderRadius: 10, width: "100%", border: "none", background: "transparent",
                  color: "#A83232", fontSize: "0.88rem", fontWeight: 500, cursor: "pointer",
                  fontFamily: "var(--font-sans)", transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <LogOut size={15} /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes scale-in { from { opacity:0; transform: scale(0.95); } to { opacity:1; transform: scale(1); } }`}</style>
    </nav>
  );
}
