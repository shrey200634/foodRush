import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import {
  Package, MapPin, Clock, CheckCircle, XCircle, ArrowLeft,
  Loader2, Navigation, Wifi, WifiOff, Phone, User, RefreshCw
} from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../../api/axios";
import socketService from "../../services/socketService";
import { notifyOrderStatus } from "../../services/notificationService";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const INK = "#1C1208";
const INK_SOFT = "rgba(28,18,8,0.58)";
const INK_MUTED = "rgba(28,18,8,0.38)";
const INK_HAIR = "rgba(28,18,8,0.07)";
const CARD = "#FFF9EE";
const FIELD = "#F5ECD8";
const TC = "#C0401E";
const TC_SOFT = "#DE6A40";
const TC_DEEP = "#8B2910";
const SUCCESS = "#15803D";
const SAFFRON = "#D4882A";

// Custom map icons
const makeIcon = (emoji, color) => L.divIcon({
  className: "",
  html: `<div style="width:44px;height:44px;border-radius:50%;background:${color};border:3px solid white;
    box-shadow:0 4px 12px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;
    font-size:22px;animation:${emoji === "🛵" ? "pulse-icon 1.5s ease-in-out infinite" : "none"}">${emoji}</div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
});

const driverIcon = makeIcon("🛵", SUCCESS);
const restaurantIcon = makeIcon("🍽", TC);
const homeIcon = makeIcon("🏠", SAFFRON);

const STATUS_STEPS = [
  { key: "PLACED",           label: "Order Placed",         icon: Package,   desc: "We received your order" },
  { key: "ACCEPTED",         label: "Restaurant Accepted",   icon: CheckCircle, desc: "Restaurant confirmed!" },
  { key: "PREPARING",        label: "Being Prepared",        icon: Package,   desc: "Chef is cooking 👨‍🍳" },
  { key: "READY",            label: "Ready for Pickup",      icon: CheckCircle, desc: "Waiting for driver..." },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery",      icon: Navigation, desc: "On the way to you! 🛵" },
  { key: "DELIVERED",        label: "Delivered",             icon: CheckCircle, desc: "Enjoy your meal! 🎉" },
];

const STATUS_INFO = {
  PLACED:           { emoji: "📝", title: "Order Placed!",       subtitle: "Waiting for restaurant...",           color: "#1D4ED8" },
  ACCEPTED:         { emoji: "✅", title: "Restaurant Accepted!", subtitle: "Your food is about to be prepared",   color: "#6D28D9" },
  PREPARING:        { emoji: "👨‍🍳", title: "Being Prepared",      subtitle: "The chef is cooking right now",      color: SAFFRON },
  READY:            { emoji: "📦", title: "Ready for Pickup!",    subtitle: "Assigning your delivery partner...", color: SUCCESS },
  OUT_FOR_DELIVERY: { emoji: "🛵", title: "On the Way!",          subtitle: "Your food is heading to you",        color: TC },
  DELIVERED:        { emoji: "🎉", title: "Delivered!",           subtitle: "Enjoy your delicious meal!",         color: SUCCESS },
  CANCELLED:        { emoji: "❌", title: "Cancelled",            subtitle: "This order was cancelled",           color: "#DC2626" },
};

function MapFlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.2 });
  }, [center?.[0], center?.[1]]);
  return null;
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [eta, setEta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(socketService.isConnected());
  const [lastUpdated, setLastUpdated] = useState(null);
  const lastStatusRef = useRef(null);
  const pollTimerRef = useRef(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      const newOrder = res.data;
      setOrder(newOrder);
      setLastUpdated(new Date());
      setLoading(false);

      // Notify if status changed
      if (lastStatusRef.current && lastStatusRef.current !== newOrder.status) {
        notifyOrderStatus(newOrder.status, newOrder.restaurantName);
      }
      lastStatusRef.current = newOrder.status;

      if (newOrder.status === "OUT_FOR_DELIVERY") {
        fetchDriverLocation();
      }
    } catch {
      setLoading(false);
    }
  }, [orderId]);

  const fetchDriverLocation = async () => {
    try {
      const res = await api.get(`/delivery/${orderId}/status`);
      if (res.data?.location) {
        setDriverLocation([res.data.location.latitude, res.data.location.longitude]);
        setEta(res.data.eta || "10-15 mins");
      }
    } catch {
      // Demo mode: simulate driver
      startDemoDriver();
    }
  };

  const startDemoDriver = () => {
    const restLat = 23.2599, restLng = 77.4126;
    const custLat = 23.2699, custLng = 77.4226;
    let p = 0;
    setDriverLocation([restLat, restLng]);
    const t = setInterval(() => {
      p += 0.025;
      if (p >= 1) { clearInterval(t); setDriverLocation([custLat, custLng]); setEta("Arrived! 🎉"); return; }
      setDriverLocation([restLat + (custLat - restLat) * p, restLng + (custLng - restLng) * p]);
      setEta(`${Math.ceil(15 * (1 - p))} mins`);
    }, 2500);
    return () => clearInterval(t);
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 12s as fallback
    pollTimerRef.current = setInterval(fetchOrder, 12000);

    // Subscribe to real-time order updates via WebSocket
    let sub1, sub2;

    const subscribeSocket = () => {
      sub1 = socketService.subscribeToOrder(orderId, (event) => {
        if (event.status) {
          setOrder((prev) => {
            if (prev?.status !== event.status) {
              notifyOrderStatus(event.status, prev?.restaurantName);
            }
            return { ...prev, ...event };
          });
          setLastUpdated(new Date());
          lastStatusRef.current = event.status;
        }
      });

      sub2 = socketService.subscribeToDriverLocation(orderId, (loc) => {
        if (loc.latitude && loc.longitude) {
          setDriverLocation([loc.latitude, loc.longitude]);
          if (loc.eta) setEta(loc.eta);
        }
      });
    };

    if (socketService.isConnected()) {
      subscribeSocket();
    } else {
      socketService.onConnect(subscribeSocket);
    }

    const offConnect = socketService.on("connected", () => setSocketConnected(true));
    const offDisconnect = socketService.on("disconnected", () => setSocketConnected(false));

    return () => {
      clearInterval(pollTimerRef.current);
      offConnect?.();
      offDisconnect?.();
      if (typeof sub1?.unsubscribe === "function") sub1.unsubscribe();
      if (typeof sub2?.unsubscribe === "function") sub2.unsubscribe();
    };
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
        <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: TC }} />
        <p style={{ color: INK_SOFT, fontSize: "1rem" }}>Loading order tracking...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!order) return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <XCircle size={48} style={{ color: TC, margin: "0 auto 16px" }} />
      <p style={{ fontSize: "1.2rem", color: INK, marginBottom: 16 }}>Order not found</p>
      <button onClick={() => navigate("/orders")} style={{
        padding: "10px 24px", borderRadius: 999, border: "none",
        background: TC, color: "#FFF5E6", cursor: "pointer",
        fontFamily: "var(--font-sans)", fontWeight: 600,
      }}>Back to Orders</button>
    </div>
  );

  const isCancelled = order.status === "CANCELLED";
  const isDelivered = order.status === "DELIVERED";
  const isDone = isCancelled || isDelivered;
  const currentStepIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
  const statusInfo = STATUS_INFO[order.status] || STATUS_INFO.PLACED;
  const showMap = order.status === "OUT_FOR_DELIVERY" && driverLocation;

  const restaurantLatLng = [23.2599, 77.4126];
  const customerLatLng = [23.2699, 77.4226];
  const route = [restaurantLatLng, ...(driverLocation ? [driverLocation] : []), customerLatLng];

  return (
    <div style={{ animation: "fade-up 0.4s ease-out", paddingBottom: 40 }}>
      {/* Back */}
      <button onClick={() => navigate(`/orders/${orderId}`)} style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px",
        borderRadius: 999, border: `1px solid ${INK_HAIR}`, background: CARD,
        color: INK_SOFT, fontSize: "0.85rem", fontFamily: "var(--font-sans)",
        cursor: "pointer", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Order details
      </button>

      {/* Live status banner */}
      <div style={{
        background: "linear-gradient(135deg, #1A1814 0%, #2D2520 100%)",
        borderRadius: 24, padding: "28px 32px", marginBottom: 24,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: `${TC}15` }} />
        <div style={{ position: "absolute", bottom: -40, right: 80, width: 160, height: 160, borderRadius: "50%", background: `${SAFFRON}10` }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Socket indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: socketConnected ? "#4ADE80" : "#94A3B8",
              boxShadow: socketConnected ? "0 0 0 3px rgba(74,222,128,0.3)" : "none",
              animation: socketConnected ? "pulse-dot 2s infinite" : "none",
            }} />
            <span style={{ fontSize: "0.68rem", color: socketConnected ? "#4ADE80" : "rgba(255,255,255,0.3)",
              textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>
              {socketConnected ? "Live tracking active" : "Polling for updates"}
            </span>
            <button onClick={fetchOrder} style={{ marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4,
              fontSize: "0.72rem", fontFamily: "var(--font-sans)" }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            <span style={{ fontSize: "2.8rem", lineHeight: 1 }}>{statusInfo.emoji}</span>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 500,
                color: "#FFF5E6", letterSpacing: "-0.02em", marginBottom: 4 }}>
                {statusInfo.title}
              </h1>
              <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>{statusInfo.subtitle}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 24, marginTop: 20, paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Order</div>
              <div style={{ fontSize: "0.9rem", color: "#FFF5E6", fontWeight: 700 }}>#{orderId?.slice(-8)}</div>
            </div>
            <div>
              <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Restaurant</div>
              <div style={{ fontSize: "0.9rem", color: "#FFF5E6", fontWeight: 700 }}>{order.restaurantName || "Restaurant"}</div>
            </div>
            {eta && (
              <div>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>ETA</div>
                <div style={{ fontSize: "0.9rem", color: TC_SOFT, fontWeight: 700 }}>{eta}</div>
              </div>
            )}
            {lastUpdated && (
              <div style={{ marginLeft: "auto" }}>
                <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Updated</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
                  {lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="track-grid" style={{
        display: "grid",
        gridTemplateColumns: showMap ? "1fr 400px" : "1fr",
        gap: 24, alignItems: "start",
      }}>
        {/* Left: Timeline + Items */}
        <div>
          {/* Status Timeline */}
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`, padding: "24px 28px", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: INK, marginBottom: 24 }}>
              Order Progress
            </h2>

            {isCancelled ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px",
                background: "#FEF2F2", borderRadius: 12, border: "1px solid #FECACA" }}>
                <XCircle size={20} style={{ color: "#DC2626", flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 600, color: "#991B1B", marginBottom: 2 }}>Order cancelled</p>
                  <p style={{ fontSize: "0.82rem", color: "#DC2626" }}>Refund will be processed to your wallet.</p>
                </div>
              </div>
            ) : (
              <div style={{ position: "relative", paddingLeft: 48 }}>
                <div style={{ position: "absolute", left: 16, top: 8, bottom: 8, width: 2, background: INK_HAIR }} />
                <div style={{
                  position: "absolute", left: 16, top: 8, width: 2, zIndex: 1,
                  height: `${Math.min(currentStepIdx / (STATUS_STEPS.length - 1), 1) * 100}%`,
                  background: `linear-gradient(180deg, ${TC_SOFT}, ${TC})`,
                  transition: "height 0.8s ease",
                }} />

                {STATUS_STEPS.map((step, i) => {
                  const done = i < currentStepIdx;
                  const active = i === currentStepIdx;
                  const future = i > currentStepIdx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} style={{
                      position: "relative", marginBottom: i < STATUS_STEPS.length - 1 ? 28 : 0,
                      opacity: future ? 0.35 : 1, transition: "opacity 0.3s",
                    }}>
                      <div style={{
                        position: "absolute", left: -48, top: 0,
                        width: 32, height: 32, borderRadius: "50%",
                        background: done || active ? `linear-gradient(135deg, ${TC_SOFT}, ${TC_DEEP})` : CARD,
                        border: `2px solid ${done || active ? TC : INK_HAIR}`,
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
                        boxShadow: active ? `0 0 0 4px ${TC}20` : "none",
                        transition: "all 0.4s",
                      }}>
                        <Icon size={13} style={{ color: done || active ? "#FFF5E6" : INK_MUTED }} />
                      </div>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: active ? 700 : done ? 600 : 400,
                          color: active ? INK : done ? INK_SOFT : INK_MUTED }}>
                          {step.label}
                        </div>
                        {(active || done) && (
                          <div style={{ fontSize: "0.78rem", color: INK_MUTED, marginTop: 2 }}>{step.desc}</div>
                        )}
                        {active && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
                            padding: "3px 10px", borderRadius: 999, background: `${TC}10`,
                            color: TC_DEEP, fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.05em",
                            textTransform: "uppercase" }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: TC,
                              animation: "pulse 1.5s ease-in-out infinite" }} />
                            Current
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order Items */}
          <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`, padding: "24px 28px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: INK, marginBottom: 18 }}>
              Order Items
            </h2>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between",
                padding: "12px 0", borderBottom: i < order.items.length - 1 ? `1px solid ${INK_HAIR}` : "none" }}>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: INK }}>
                    {item.quantity}× {item.name || item.menuItemName}
                  </div>
                  {item.isVeg !== undefined && (
                    <span style={{ fontSize: "0.7rem", color: item.isVeg ? SUCCESS : TC,
                      marginTop: 2, display: "inline-block" }}>
                      {item.isVeg ? "🟢 Veg" : "🔺 Non-veg"}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: INK, fontFamily: "var(--font-display)" }}>
                  ₹{(item.price || 0) * (item.quantity || 1)}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `2px solid ${INK_HAIR}`,
              display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: INK }}>Total</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: TC, fontFamily: "var(--font-display)" }}>
                ₹{order.totalAmount}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Live Map */}
        {showMap && (
          <div>
            {/* Map */}
            <div style={{ background: CARD, borderRadius: 20, border: `1px solid ${INK_HAIR}`,
              overflow: "hidden", marginBottom: 16, height: 380 }}>
              <MapContainer center={driverLocation || restaurantLatLng} zoom={14}
                style={{ height: "100%", width: "100%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <MapFlyTo center={driverLocation} />

                <Marker position={restaurantLatLng} icon={restaurantIcon}>
                  <Popup><strong>{order.restaurantName}</strong><br/>Pick-up point</Popup>
                </Marker>

                {driverLocation && (
                  <Marker position={driverLocation} icon={driverIcon}>
                    <Popup>🛵 Your delivery partner<br/>{eta && `ETA: ${eta}`}</Popup>
                  </Marker>
                )}

                <Marker position={customerLatLng} icon={homeIcon}>
                  <Popup>🏠 Your location</Popup>
                </Marker>

                {route.length >= 2 && (
                  <Polyline positions={route} color={TC} weight={4} opacity={0.75}
                    dashArray={driverLocation ? undefined : "8 8"} />
                )}
              </MapContainer>
            </div>

            {/* ETA card */}
            {eta && (
              <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${INK_HAIR}`,
                padding: "18px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `${TC}12`,
                    display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Clock size={20} style={{ color: TC }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "0.7rem", color: INK_MUTED, marginBottom: 2,
                      textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                      Estimated arrival
                    </div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700, color: INK, fontFamily: "var(--font-display)" }}>
                      {eta}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Driver info */}
            {order.driverName && (
              <div style={{ background: CARD, borderRadius: 16, border: `1px solid ${INK_HAIR}`, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%",
                    background: `linear-gradient(135deg, ${TC_SOFT}, ${TC})`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#FFF5E6", fontSize: "1.2rem", fontWeight: 700 }}>
                    {order.driverName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: INK }}>{order.driverName}</div>
                    <div style={{ fontSize: "0.75rem", color: INK_MUTED }}>Your delivery partner</div>
                  </div>
                </div>
                {order.driverPhone && (
                  <button style={{ width: "100%", padding: "10px", borderRadius: 12, border: "none",
                    background: `${TC}10`, color: TC, cursor: "pointer", fontFamily: "var(--font-sans)",
                    fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                    gap: 8, fontSize: "0.88rem" }}>
                    <Phone size={14} /> Call driver
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,0.4)}50%{box-shadow:0 0 0 5px rgba(74,222,128,0)} }
        @keyframes pulse-icon { 0%,100%{transform:scale(1)}50%{transform:scale(1.08)} }
        @media (max-width: 768px) {
          .track-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
