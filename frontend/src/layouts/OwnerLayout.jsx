import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingBag, ChefHat, Settings,
  LogOut, Menu, X, Store, ChevronRight
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useOwnerStore } from "../store/ownerStore";

const BG      = "#0F0D0B";
const SIDEBAR = "#161210";
const BORDER  = "rgba(255,255,255,0.07)";
const MUTED   = "rgba(255,255,255,0.38)";
const SOFT    = "rgba(255,255,255,0.65)";
const WHITE   = "#FFF5E6";
const TC      = "#C0401E";
const TC_SOFT = "#DE6A40";
const SUCCESS = "#15803D";

const NAV_ITEMS = [
  { to: "/owner",          label: "Overview",   Icon: LayoutDashboard, exact: true },
  { to: "/owner/orders",   label: "Orders",     Icon: ShoppingBag },
  { to: "/owner/menu",     label: "Menu",       Icon: ChefHat },
  { to: "/owner/settings", label: "Settings",   Icon: Settings },
];

export default function OwnerLayout() {
  const { user, logout } = useAuthStore();
  const { currentRestaurant } = useOwnerStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };

  const Sidebar = ({ mobile = false }) => (
    <aside style={{
      width: mobile ? 280 : collapsed ? 72 : 240,
      background: SIDEBAR,
      borderRight: `1px solid ${BORDER}`,
      display: "flex", flexDirection: "column",
      height: "100vh", flexShrink: 0,
      transition: "width 0.25s ease",
      position: mobile ? "fixed" : "sticky",
      top: 0, left: 0, zIndex: mobile ? 300 : 1,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px", borderBottom: `1px solid ${BORDER}`,
        display: "flex", alignItems: "center", gap: 10, minHeight: 72 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontSize: "1.2rem", fontWeight: 700,
          color: WHITE, fontStyle: "italic" }}>f</div>
        {(!collapsed || mobile) && (
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: WHITE,
              letterSpacing: "-0.01em", lineHeight: 1 }}>
              foodrush<span style={{ color: TC }}>.</span>
            </div>
            <div style={{ fontSize: "0.62rem", color: MUTED, textTransform: "uppercase",
              letterSpacing: "0.12em", fontWeight: 700, marginTop: 2 }}>Owner Portal</div>
          </div>
        )}
        {!mobile && (
          <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: "auto", flexShrink: 0,
            background: "none", border: "none", cursor: "pointer", color: MUTED, padding: 4,
            display: "flex", alignItems: "center", transition: "color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.color = SOFT}
            onMouseLeave={e => e.currentTarget.style.color = MUTED}>
            <ChevronRight size={16} style={{ transform: collapsed ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.25s" }} />
          </button>
        )}
      </div>

      {/* Restaurant name */}
      {currentRestaurant && (!collapsed || mobile) && (
        <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: "0.65rem", color: MUTED, textTransform: "uppercase",
            letterSpacing: "0.12em", fontWeight: 700, marginBottom: 4 }}>Active Restaurant</div>
          <div style={{ fontSize: "0.88rem", color: WHITE, fontWeight: 600,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {currentRestaurant.name}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%",
              background: currentRestaurant.isOpen ? SUCCESS : "#94A3B8" }} />
            <span style={{ fontSize: "0.7rem", color: currentRestaurant.isOpen ? SUCCESS : MUTED, fontWeight: 600 }}>
              {currentRestaurant.isOpen ? "Open" : "Closed"}
            </span>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {NAV_ITEMS.map(({ to, label, Icon, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: "flex", alignItems: "center", gap: 10,
              padding: collapsed && !mobile ? "12px 0" : "11px 12px",
              justifyContent: collapsed && !mobile ? "center" : "flex-start",
              borderRadius: 10, marginBottom: 2, textDecoration: "none",
              background: isActive ? `${TC}18` : "transparent",
              color: isActive ? TC_SOFT : SOFT,
              fontFamily: "var(--font-sans)", fontSize: "0.88rem", fontWeight: 600,
              transition: "all 0.15s",
              border: `1px solid ${isActive ? TC + "30" : "transparent"}`,
            })}>
            {({ isActive }) => (<>
              <Icon size={18} style={{ flexShrink: 0, color: isActive ? TC_SOFT : MUTED }} />
              {(!collapsed || mobile) && <span>{label}</span>}
            </>)}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div style={{ padding: "12px 8px", borderTop: `1px solid ${BORDER}` }}>
        {(!collapsed || mobile) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
            borderRadius: 10, marginBottom: 6, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: WHITE, fontSize: "0.82rem", fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.82rem", color: WHITE, fontWeight: 600,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.name || "Owner"}
              </div>
              <div style={{ fontSize: "0.68rem", color: MUTED }}>Restaurant Owner</div>
            </div>
          </div>
        )}
        <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center",
          gap: 10, padding: collapsed && !mobile ? "12px 0" : "10px 12px",
          justifyContent: collapsed && !mobile ? "center" : "flex-start",
          borderRadius: 10, border: "none", background: "transparent", cursor: "pointer",
          color: "#FC8181", fontFamily: "var(--font-sans)", fontSize: "0.85rem", fontWeight: 600,
          transition: "background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(252,129,129,0.1)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {(!collapsed || mobile) && "Sign out"}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0D0B" }}>
      {/* Desktop sidebar */}
      <div className="hide-mobile"><Sidebar /></div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 299, backdropFilter: "blur(4px)" }} />
          <Sidebar mobile />
        </>
      )}

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        {/* Mobile top bar */}
        <div className="hide-desktop" style={{ height: 56, background: SIDEBAR, borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", padding: "0 16px", gap: 12 }}>
          <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none",
            cursor: "pointer", color: SOFT, display: "flex", padding: 4 }}>
            <Menu size={22} />
          </button>
          <div style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", color: WHITE }}>
            {currentRestaurant?.name || "Owner Dashboard"}
          </div>
        </div>

        <main style={{ flex: 1, padding: "32px 36px", overflowY: "auto" }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hide-mobile { display: none !important; }
          main { padding: 20px 16px !important; }
        }
        @media (min-width: 769px) {
          .hide-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
