import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import toast from "react-hot-toast";
import {
  Navigation, Package, CheckCircle, DollarSign,
  Loader2, Wifi, WifiOff, MapPin, Phone, AlertCircle
} from "lucide-react";
import { useDriverStore } from "../../store/driverStore";
import { useAuthStore } from "../../store/authStore";
import socketService from "../../services/socketService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const TC      = "#C0401E";
const TC_SOFT = "#DE6A40";
const SUCCESS = "#15803D";
const SAFFRON = "#D4882A";
const INK     = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.6)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD    = "#FFF9EE";
const FIELD   = "#F5ECD8";

const makeIcon = (emoji, color) => L.divIcon({
  className: "",
  html: `<div style="width:44px;height:44px;border-radius:50%;background:${color};
    border:3px solid white;box-shadow:0 4px 14px rgba(0,0,0,0.3);
    display:flex;align-items:center;justify-content:center;font-size:20px">${emoji}</div>`,
  iconSize: [44, 44], iconAnchor: [22, 44], popupAnchor: [0, -44],
});
const driverIcon = makeIcon("🛵", SUCCESS);
const restIcon   = makeIcon("🍽", TC);
const homeIcon   = makeIcon("🏠", SAFFRON);

function MapFlyTo({ pos }) {
  const map = useMap();
  useEffect(() => { if (pos) map.flyTo(pos, 15, { animate: true, duration: 1 }); }, [pos?.[0], pos?.[1]]);
  return null;
}

export default function DriverHome() {
  const { user } = useAuthStore();
  const {
    driverProfile, activeDelivery, isOnline, currentLocation,
    fetchProfile, goOnline, goOffline,
    startLocationTracking, stopLocationTracking,
    fetchActiveDelivery, confirmPickup, completeDelivery, registerDriver,
  } = useDriverStore();

  const [toggling, setToggling]     = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [newAssignment, setNew]     = useState(false);
  const [mapCenter, setMapCenter]   = useState([28.6139, 77.209]);
  const locTimer = useRef(null);

  useEffect(() => {
    fetchProfile().catch(() => {});
    fetchActiveDelivery().catch(() => {});
    const t = setInterval(() => fetchActiveDelivery().catch(() => {}), 20000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (currentLocation) setMapCenter([currentLocation.latitude, currentLocation.longitude]);
  }, [currentLocation]);

  // WebSocket assignment listener
  useEffect(() => {
    if (!driverProfile?.driverId) return;
    let sub;
    const subscribe = () => {
      sub = socketService.subscribeToDriverAssignments(driverProfile.driverId, () => {
        toast.success("🔔 New delivery assigned!", { duration: 6000 });
        setNew(true); setTimeout(() => setNew(false), 8000);
        fetchActiveDelivery();
      });
    };
    if (socketService.isConnected()) subscribe();
    else socketService.onConnect(subscribe);
    return () => { if (typeof sub?.unsubscribe === "function") sub.unsubscribe(); };
  }, [driverProfile?.driverId]);

  // Emit location via WS every 5s when active
  useEffect(() => {
    if (!isOnline || !currentLocation || !activeDelivery) return;
    const send = () => socketService.sendDriverLocation(
      activeDelivery.orderId, driverProfile?.driverId,
      currentLocation.latitude, currentLocation.longitude
    );
    locTimer.current = setInterval(send, 5000);
    send();
    return () => clearInterval(locTimer.current);
  }, [isOnline, currentLocation?.latitude, currentLocation?.longitude, activeDelivery?.orderId]);

  // Toggle online
  const handleToggle = async () => {
    setToggling(true);
    try {
      if (isOnline) {
        await goOffline(); stopLocationTracking(); clearInterval(locTimer.current);
        toast.success("You're offline. Rest well! 😴");
      } else {
        const pos = await new Promise(res =>
          navigator.geolocation.getCurrentPosition(res,
            () => res({ coords: { latitude: 28.6139, longitude: 77.209 } }),
            { timeout: 8000 })
        );
        await goOnline(pos.coords.latitude, pos.coords.longitude);
        startLocationTracking();
        setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        toast.success("You're online! Ready for deliveries 🚀");
      }
    } catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    setToggling(false);
  };

  const handlePickup = async () => {
    setActionBusy(true);
    try { await confirmPickup(); toast.success("Pickup confirmed! Head to customer 🏠"); }
    catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    setActionBusy(false);
  };

  const handleComplete = async () => {
    setActionBusy(true);
    try { await completeDelivery(); toast.success("Delivery complete! Great job 🎉"); }
    catch (err) { toast.error(err?.response?.data?.message || "Failed"); }
    setActionBusy(false);
  };

  // Driver registration screen
  if (!driverProfile) return <RegisterScreen onSuccess={async () => { await fetchProfile(); }} />;

  const locPos = currentLocation ? [currentLocation.latitude, currentLocation.longitude] : null;
  const pickPos = activeDelivery?.pickupLatitude ? [activeDelivery.pickupLatitude, activeDelivery.pickupLongitude] : null;
  const custPos = activeDelivery?.deliveryLatitude ? [activeDelivery.deliveryLatitude, activeDelivery.deliveryLongitude] : null;
  const dStatus = activeDelivery?.deliveryStatus || activeDelivery?.status || "";
  const isPickedUp = dStatus === "PICKED_UP";

  return (
    <div style={{ paddingBottom: 24 }}>
      {/* New assignment banner */}
      {newAssignment && (
        <div style={{ background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
          margin: "16px 16px 0", borderRadius: 14, padding: "14px 18px",
          display: "flex", alignItems: "center", gap: 10, animation: "slide-in 0.3s ease-out",
          boxShadow: `0 4px 20px ${TC}40` }}>
          <span style={{ fontSize: "1.4rem" }}>🔔</span>
          <div>
            <div style={{ color: "#FFF5E6", fontWeight: 700, fontSize: "0.92rem" }}>New delivery assigned!</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.76rem" }}>Check below for details</div>
          </div>
        </div>
      )}

      {/* Greeting + toggle */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500,
              color: INK, letterSpacing: "-0.02em" }}>
              Hey, {user?.name?.split(" ")[0] || "Driver"} 👋
            </h2>
            <p style={{ fontSize: "0.8rem", color: INK_MUTED, marginTop: 3 }}>
              {driverProfile.vehicleType} · {driverProfile.vehicleNumber || "—"}
            </p>
          </div>
          <button onClick={handleToggle} disabled={toggling} style={{
            padding: "12px 18px", borderRadius: 14, border: "none",
            background: isOnline ? "linear-gradient(135deg,#16A34A,#15803D)" : `linear-gradient(135deg,${TC_SOFT},${TC})`,
            color: "#FFF5E6", fontWeight: 700, fontSize: "0.9rem",
            cursor: toggling ? "not-allowed" : "pointer",
            boxShadow: isOnline ? "0 4px 16px rgba(21,128,61,0.45)" : `0 4px 16px ${TC}50`,
            display: "flex", alignItems: "center", gap: 8, opacity: toggling ? 0.7 : 1 }}>
            {toggling ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
              : isOnline ? <WifiOff size={16} /> : <Wifi size={16} />}
            {isOnline ? "Go Offline" : "Go Online"}
          </button>
        </div>

        {/* Quick stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <StatCard label="Active" value={activeDelivery ? "1" : "0"} icon="📦"
            highlight={!!activeDelivery} color={TC} />
          <StatCard label="Status" value={isOnline ? "Online" : "Offline"} icon={isOnline ? "🟢" : "⚫"}
            highlight={isOnline} color={SUCCESS} />
        </div>
      </div>

      {/* Active delivery card */}
      {activeDelivery ? (
        <div style={{ margin: "0 16px 20px", background: "#FFF", borderRadius: 20,
          border: `2px solid ${TC}25`, overflow: "hidden",
          boxShadow: `0 6px 24px ${TC}15` }}>
          <div style={{ background: `linear-gradient(135deg, ${TC_SOFT}15, ${TC}08)`,
            padding: "18px 20px", borderBottom: `1px solid ${INK_HAIR}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: INK_MUTED }}>Active Delivery</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "1.3rem", color: INK, marginTop: 2 }}>
                  #{(activeDelivery.orderId || "").slice(-6).toUpperCase()}
                </div>
              </div>
              <span style={{ padding: "6px 14px", borderRadius: 999,
                background: isPickedUp ? `${SUCCESS}15` : `${TC}12`,
                color: isPickedUp ? SUCCESS : TC,
                fontSize: "0.75rem", fontWeight: 700 }}>
                {isPickedUp ? "Picked Up" : "Assigned"}
              </span>
            </div>
          </div>

          <div style={{ padding: "18px 20px" }}>
            {/* Route */}
            <RouteStop icon="🍽" label="Pick up from" name={activeDelivery.restaurantName || "Restaurant"}
              addr={activeDelivery.pickupAddress || "Restaurant address"} color={TC} />
            <div style={{ width: 2, height: 20, background: INK_HAIR, marginLeft: 21, marginTop: 4, marginBottom: 4 }} />
            <RouteStop icon="🏠" label="Deliver to" name={activeDelivery.customerName || "Customer"}
              addr={activeDelivery.deliveryAddress || activeDelivery.deliverAddress || "Customer address"}
              color={SAFFRON} />

            {/* Earnings */}
            {(activeDelivery.deliveryFee || activeDelivery.earnings) && (
              <div style={{ marginTop: 16, padding: "10px 14px", background: `${SUCCESS}0C`,
                borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
                border: `1px solid ${SUCCESS}20` }}>
                <DollarSign size={15} style={{ color: SUCCESS }} />
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: SUCCESS }}>
                  Earning: ₹{parseFloat(activeDelivery.deliveryFee || activeDelivery.earnings || 0).toFixed(0)}
                </span>
              </div>
            )}

            {/* Big action button */}
            <button
              onClick={isPickedUp ? handleComplete : handlePickup}
              disabled={actionBusy}
              style={{ width: "100%", marginTop: 18, padding: "16px", borderRadius: 14, border: "none",
                background: isPickedUp
                  ? "linear-gradient(135deg,#16A34A,#15803D)"
                  : `linear-gradient(135deg,${TC_SOFT},${TC})`,
                color: "#FFF5E6", fontWeight: 700, fontSize: "1rem",
                cursor: actionBusy ? "not-allowed" : "pointer",
                fontFamily: "var(--font-sans)", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 10,
                boxShadow: isPickedUp ? "0 6px 20px rgba(21,128,61,0.4)" : `0 6px 20px ${TC}40`,
                opacity: actionBusy ? 0.7 : 1 }}>
              {actionBusy
                ? <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                : isPickedUp ? <><CheckCircle size={20} /> Complete Delivery</>
                  : <><Package size={20} /> Confirm Pickup</>}
            </button>
          </div>
        </div>
      ) : (
        /* Waiting state */
        <div style={{ margin: "0 16px 20px", background: CARD, borderRadius: 20,
          border: `1.5px dashed ${INK_HAIR}`, padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: 12 }}>{isOnline ? "⏳" : "💤"}</div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: INK, marginBottom: 6 }}>
            {isOnline ? "Waiting for a delivery..." : "You're offline"}
          </h3>
          <p style={{ fontSize: "0.84rem", color: INK_MUTED, lineHeight: 1.6 }}>
            {isOnline
              ? "Stay in the app. A delivery will be assigned to you automatically."
              : "Toggle 'Go Online' above to start accepting deliveries."}
          </p>
        </div>
      )}

      {/* Live Map */}
      <div style={{ margin: "0 16px", borderRadius: 20, overflow: "hidden",
        border: `1px solid ${INK_HAIR}`, height: 280,
        boxShadow: "0 4px 20px rgba(28,18,8,0.08)" }}>
        <MapContainer center={mapCenter} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors' />
          <MapFlyTo pos={locPos || (pickPos ? pickPos : undefined)} />
          {locPos  && <Marker position={locPos} icon={driverIcon}><Popup>📍 You</Popup></Marker>}
          {pickPos && <Marker position={pickPos} icon={restIcon}><Popup>🍽 Restaurant</Popup></Marker>}
          {custPos && <Marker position={custPos} icon={homeIcon}><Popup>🏠 Customer</Popup></Marker>}
          {locPos && pickPos && !isPickedUp && (
            <Polyline positions={[locPos, pickPos]} color={TC} weight={3} opacity={0.7} dashArray="8 6" />
          )}
          {locPos && custPos && isPickedUp && (
            <Polyline positions={[locPos, custPos]} color={SUCCESS} weight={3} opacity={0.8} />
          )}
        </MapContainer>
      </div>

      {/* Location pill */}
      {currentLocation && (
        <div style={{ margin: "12px 16px 0", padding: "10px 14px", background: CARD,
          borderRadius: 10, border: `1px solid ${INK_HAIR}`,
          display: "flex", alignItems: "center", gap: 8 }}>
          <Navigation size={13} style={{ color: SUCCESS }} />
          <span style={{ fontSize: "0.76rem", color: INK_MUTED }}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </span>
          <span style={{ marginLeft: "auto", fontSize: "0.68rem", fontWeight: 800,
            color: SUCCESS, textTransform: "uppercase", letterSpacing: "0.08em" }}>LIVE</span>
        </div>
      )}

      <style>{`
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slide-in { from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, icon, highlight, color }) {
  return (
    <div style={{ background: highlight ? `${color}12` : CARD, borderRadius: 16, padding: "16px 18px",
      border: `1px solid ${highlight ? color + "30" : INK_HAIR}` }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", fontWeight: 500,
        color: highlight ? color : INK }}>{value}</div>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
        letterSpacing: "0.1em", color: INK_MUTED, marginTop: 3 }}>{label}</div>
    </div>
  );
}

function RouteStop({ icon, label, name, addr, color }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${color}12`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, fontSize: "1.1rem" }}>{icon}</div>
      <div>
        <div style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: INK }}>{name}</div>
        <div style={{ fontSize: "0.76rem", color: INK_MUTED, marginTop: 2 }}>{addr}</div>
      </div>
    </div>
  );
}

function RegisterScreen({ onSuccess }) {
  const { registerDriver } = useDriverStore();
  const [form, setForm] = useState({ vehicleType: "MOTORCYCLE", vehicleNumber: "", licenseNumber: "" });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.vehicleNumber || !form.licenseNumber) { toast.error("All fields required"); return; }
    setLoading(true);
    try { await registerDriver(form); await onSuccess(); toast.success("Welcome aboard! 🎉"); }
    catch (err) { toast.error(err?.response?.data?.message || "Registration failed"); }
    setLoading(false);
  };

  return (
    <div style={{ padding: "32px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontSize: "3.5rem", marginBottom: 12 }}>🛵</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: INK, marginBottom: 8 }}>
          Become a Driver
        </h2>
        <p style={{ fontSize: "0.9rem", color: INK_MUTED, lineHeight: 1.6 }}>
          Join our delivery fleet and start earning today!
        </p>
      </div>

      <div style={{ background: CARD, borderRadius: 20, padding: "24px", border: `1px solid ${INK_HAIR}` }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 8 }}>Vehicle Type</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["MOTORCYCLE","🏍 Moto"],["BICYCLE","🚲 Bike"],["CAR","🚗 Car"]].map(([v, label]) => (
              <button key={v} onClick={() => setForm(p => ({ ...p, vehicleType: v }))} style={{
                flex: 1, padding: "10px 4px", borderRadius: 10, border: "1.5px solid",
                borderColor: form.vehicleType === v ? TC : INK_HAIR,
                background: form.vehicleType === v ? `${TC}10` : "transparent",
                color: form.vehicleType === v ? TC : INK_MUTED,
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer" }}>{label}</button>
            ))}
          </div>
        </div>

        {[
          ["vehicleNumber", "Vehicle Number", "e.g. DL 01 AB 1234"],
          ["licenseNumber", "License Number", "Driver's license no."],
        ].map(([key, label, ph]) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.1em", color: INK_MUTED, marginBottom: 7 }}>{label}</label>
            <input value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              placeholder={ph}
              style={{ width: "100%", padding: "13px 15px", background: FIELD, borderRadius: 12,
                border: "1.5px solid transparent", fontSize: "0.95rem", color: INK,
                fontFamily: "var(--font-sans)", outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = TC}
              onBlur={e => e.target.style.borderColor = "transparent"} />
          </div>
        ))}

        <button onClick={handleRegister} disabled={loading} style={{ width: "100%", marginTop: 8, padding: "15px",
          borderRadius: 14, border: "none", background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
          color: "#FFF5E6", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", justifyContent: "center",
          gap: 10, boxShadow: `0 6px 20px ${TC}40`, opacity: loading ? 0.7 : 1 }}>
          {loading && <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />}
          Register as Driver
        </button>
      </div>
    </div>
  );
}
