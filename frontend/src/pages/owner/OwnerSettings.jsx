import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader2, Save } from "lucide-react";
import { useOwnerStore } from "../../store/ownerStore";

const TC_SOFT = "#DE6A40";
const TC      = "#C0401E";
const SUCCESS = "#15803D";
const PISTACHIO = "#5A7040";

export default function OwnerSettings() {
  const { currentRestaurant, updateRestaurant } = useOwnerStore();
  const [form, setForm] = useState({
    name: "", description: "", cuisineType: "", address: "",
    phone: "", minOrderAmount: 0, deliveryFee: 30, avgDeliveryTimeMins: 30, isPureVeg: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentRestaurant) {
      setForm({
        name: currentRestaurant.name || "",
        description: currentRestaurant.description || "",
        cuisineType: currentRestaurant.cuisineType || "",
        address: currentRestaurant.address || "",
        phone: currentRestaurant.phone || "",
        minOrderAmount: currentRestaurant.minOrderAmount || 0,
        deliveryFee: currentRestaurant.deliveryFee || 30,
        avgDeliveryTimeMins: currentRestaurant.avgDeliveryTimeMins || 30,
        isPureVeg: currentRestaurant.isPureVeg || false,
      });
    }
  }, [currentRestaurant?.restaurantId]);

  const handleSave = async () => {
    setSaving(true);
    try { await updateRestaurant(currentRestaurant.restaurantId, form); toast.success("Settings saved!"); }
    catch { toast.error("Failed to save settings"); }
    setSaving(false);
  };

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const inputStyle = { width: "100%", padding: "11px 14px", background: "rgba(255,255,255,0.06)",
    borderRadius: 10, border: "1px solid rgba(255,245,230,0.1)", fontSize: "0.9rem",
    color: "#FFF5E6", fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s" };

  const Field = ({ label, name, type = "text", placeholder, half }) => (
    <div style={{ marginBottom: 20, ...(half ? {} : {}) }}>
      <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: "rgba(255,245,230,0.4)", marginBottom: 7 }}>{label}</label>
      <input type={type} value={form[name] || ""} onChange={set(name)} placeholder={placeholder}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = TC_SOFT}
        onBlur={e => e.target.style.borderColor = "rgba(255,245,230,0.1)"} />
    </div>
  );

  return (
    <div style={{ color: "#FFF5E6", animation: "fade-up 0.4s ease-out", maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500 }}>Settings</h1>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,245,230,0.38)", marginTop: 4 }}>
          Manage your restaurant details and preferences
        </p>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "28px 32px",
        border: "1px solid rgba(255,245,230,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 22,
          color: "rgba(255,245,230,0.8)", fontWeight: 500 }}>Basic Info</h2>
        <Field label="Restaurant Name" name="name" placeholder="e.g. Sharma's Kitchen" />
        <Field label="Description" name="description" placeholder="A short description of your restaurant" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="Cuisine Type" name="cuisineType" placeholder="e.g. North Indian" />
          <Field label="Phone Number" name="phone" placeholder="+91 98765 43210" />
        </div>
        <Field label="Full Address" name="address" placeholder="Street, City, State, PIN" />
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "28px 32px",
        border: "1px solid rgba(255,245,230,0.08)", marginBottom: 20 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 22,
          color: "rgba(255,245,230,0.8)", fontWeight: 500 }}>Delivery Settings</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <Field label="Min. Order Amount (₹)" name="minOrderAmount" type="number" />
          <Field label="Delivery Fee (₹)" name="deliveryFee" type="number" />
          <Field label="Avg. Delivery Time (mins)" name="avgDeliveryTimeMins" type="number" />
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 20, padding: "24px 32px",
        border: "1px solid rgba(255,245,230,0.08)", marginBottom: 28 }}>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", marginBottom: 20,
          color: "rgba(255,245,230,0.8)", fontWeight: 500 }}>Dietary</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setForm(p => ({ ...p, isPureVeg: !p.isPureVeg }))}
            style={{ width: 48, height: 26, borderRadius: 999, border: "none", cursor: "pointer",
              background: form.isPureVeg ? PISTACHIO : "rgba(255,255,255,0.12)",
              position: "relative", transition: "background 0.25s", flexShrink: 0 }}>
            <span style={{ position: "absolute", top: 3, left: form.isPureVeg ? 24 : 3,
              width: 20, height: 20, borderRadius: "50%", background: "#FFF",
              transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
          </button>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Pure Vegetarian</div>
            <div style={{ fontSize: "0.75rem", color: "rgba(255,245,230,0.38)", marginTop: 2 }}>
              Only vegetarian items will appear on your menu
            </div>
          </div>
        </div>
      </div>

      <button onClick={handleSave} disabled={saving} style={{ padding: "14px 32px", borderRadius: 12,
        border: "none", background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`, color: "#FFF5E6",
        fontWeight: 700, fontSize: "0.95rem", cursor: saving ? "not-allowed" : "pointer",
        fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: 10,
        boxShadow: `0 4px 20px ${TC}50`, opacity: saving ? 0.7 : 1 }}>
        {saving ? <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={18} />}
        Save All Changes
      </button>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @media (max-width: 600px) {
          div[style*="grid-template-columns: 1fr 1fr 1fr"] { grid-template-columns: 1fr !important; }
          div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
