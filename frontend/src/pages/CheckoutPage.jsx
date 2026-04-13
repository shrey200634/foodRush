import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, CheckCircle, Loader2, ArrowLeft, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../store/cartStore";
import { useAddressStore } from "../store/addressStore";
import { useOrderStore } from "../store/orderStore";

const INK = "#2B1D12";
const INK_SOFT = "rgba(43,29,18,0.62)";
const INK_MUTED = "rgba(43,29,18,0.45)";
const INK_HAIR = "rgba(43,29,18,0.08)";
const CARD = "#FFF9EC";
const FIELD = "#F5EAD4";
const TERRACOTTA = "#C14A2A";
const TERRACOTTA_SOFT = "#E07848";
const TERRACOTTA_DEEP = "#8A2F18";
const VEG = "#4A7C2B";

function VegDot({ isVeg }) {
  const c = isVeg ? VEG : "#A83232";
  return (
    <span style={{
      width: 9, height: 9, border: `1.5px solid ${c}`,
      borderRadius: 2, display: "inline-flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
    </span>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, restaurantName, getTotal, clearCart } = useCartStore();
  const { addresses, fetchAddresses } = useAddressStore();
  const { placeOrder } = useOrderStore();
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const total = getTotal();

  useEffect(() => {
    fetchAddresses();
    if (items.length === 0 && !success) navigate("/");
  }, []);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0].addressId);
    }
  }, [addresses]);

  const deliveryFee = total >= 499 ? 0 : 29;
  
  const grandTotal = total + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return toast.error("Please select a delivery address");
    setPlacing(true);
    try {
      const addrObj = addresses.find((a) => a.addressId === selectedAddress);
      const order = await placeOrder(addrObj);
      await clearCart();
      setOrderId(order.orderId);
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (success) {
    return (
      <div style={{
        maxWidth: 480, margin: "60px auto", textAlign: "center",
        animation: "fade-up 0.5s ease-out",
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: `${VEG}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <CheckCircle size={40} style={{ color: VEG }} />
        </div>
        <h2 style={{
          fontFamily: "var(--font-display)", fontSize: "2rem",
          fontWeight: 500, color: INK, marginBottom: 10, letterSpacing: "-0.02em",
        }}>Order placed! 🎉</h2>
        <p style={{ color: INK_SOFT, fontSize: "0.95rem", marginBottom: 8 }}>
          Your food is being prepared. Sit tight!
        </p>
        {orderId && (
          <p style={{ fontSize: "0.82rem", color: INK_MUTED, marginBottom: 32 }}>
            Order #{orderId}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => navigate(orderId ? `/orders/${orderId}/track` : "/orders")} style={{
            padding: "12px 24px", borderRadius: 12, border: "none",
            background: `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
            color: "#FFF5E6", fontSize: "0.9rem", fontWeight: 600,
            fontFamily: "var(--font-sans)", cursor: "pointer",
            boxShadow: `0 6px 18px ${TERRACOTTA}40`,
          }}>Track my order</button>
          <button onClick={() => navigate("/")} style={{
            padding: "12px 24px", borderRadius: 12,
            border: `1px solid ${INK_HAIR}`, background: CARD,
            color: INK_SOFT, fontSize: "0.9rem", fontWeight: 500,
            fontFamily: "var(--font-sans)", cursor: "pointer",
          }}>Back to home</button>
        </div>
        <style>{`@keyframes fade-up { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      <button onClick={() => navigate(-1)} style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "8px 14px", borderRadius: 999, border: `1px solid ${INK_HAIR}`,
        background: CARD, color: INK_SOFT, fontSize: "0.85rem",
        fontFamily: "var(--font-sans)", cursor: "pointer", marginBottom: 28,
      }}>
        <ArrowLeft size={14} /> Back
      </button>

      <h1 style={{
        fontFamily: "var(--font-display)", fontSize: "2.2rem",
        fontWeight: 500, letterSpacing: "-0.02em", color: INK, marginBottom: 32,
      }}>Checkout</h1>

      <div className="checkout-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 32, alignItems: "start" }}>
        {/* LEFT: Address selection */}
        <div>
          <h2 style={{
            fontSize: "1rem", fontWeight: 700, color: INK,
            marginBottom: 16, letterSpacing: "-0.005em",
          }}>Deliver to</h2>

          {addresses.length === 0 ? (
            <div style={{
              background: CARD, borderRadius: 14, border: `1.5px dashed ${INK_HAIR}`,
              padding: "32px 24px", textAlign: "center",
            }}>
              <MapPin size={28} style={{ color: INK_MUTED, margin: "0 auto 12px", display: "block" }} />
              <p style={{ fontWeight: 600, color: INK, marginBottom: 4 }}>No addresses saved</p>
              <p style={{ fontSize: "0.85rem", color: INK_SOFT, marginBottom: 16 }}>
                Add a delivery address to continue
              </p>
              <button onClick={() => navigate("/addresses")} style={{
                padding: "10px 20px", borderRadius: 999, border: "none",
                background: TERRACOTTA, color: "#FFF5E6",
                fontSize: "0.85rem", fontWeight: 600,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}>
                <Plus size={14} /> Add address
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {addresses.map((addr) => {
                const selected = selectedAddress === addr.addressId;
                const labels = { HOME: "🏠 Home", WORK: "💼 Work", OTHER: "📍 Other" };
                return (
                  <div
                    key={addr.addressId}
                    onClick={() => setSelectedAddress(addr.addressId)}
                    style={{
                      background: selected ? `${TERRACOTTA}06` : CARD,
                      borderRadius: 14,
                      border: `1.5px solid ${selected ? TERRACOTTA : INK_HAIR}`,
                      padding: "16px 20px",
                      cursor: "pointer", transition: "all 0.2s",
                      display: "flex", alignItems: "flex-start", gap: 14,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `2px solid ${selected ? TERRACOTTA : INK_HAIR}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 2,
                      background: selected ? TERRACOTTA : "transparent",
                      transition: "all 0.2s",
                    }}>
                      {selected && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#FFF" }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: INK, marginBottom: 4 }}>
                        {labels[addr.label] || addr.label}
                      </div>
                      <p style={{ fontSize: "0.84rem", color: INK_SOFT, lineHeight: 1.5 }}>
                        {[addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                      </p>
                    </div>
                  </div>
                );
              })}
              <button onClick={() => navigate("/addresses")} style={{
                padding: "12px", borderRadius: 12,
                border: `1.5px dashed ${INK_HAIR}`, background: "transparent",
                color: INK_MUTED, fontSize: "0.85rem", fontWeight: 500,
                fontFamily: "var(--font-sans)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <Plus size={14} /> Add new address
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Order summary */}
        <div style={{
          background: CARD, borderRadius: 18, border: `1px solid ${INK_HAIR}`,
          padding: "24px", position: "sticky", top: 96,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 18,
            paddingBottom: 14, borderBottom: `1px solid ${INK_HAIR}`,
          }}>
            <ShoppingBag size={16} style={{ color: TERRACOTTA }} />
            <h3 style={{
              fontFamily: "var(--font-display)", fontSize: "1.1rem",
              fontWeight: 500, color: INK,
            }}>Order summary</h3>
          </div>

          {restaurantName && (
            <p style={{ fontSize: "0.78rem", color: INK_MUTED, marginBottom: 14 }}>
              from {restaurantName}
            </p>
          )}

          {/* Items */}
          <div style={{ marginBottom: 18 }}>
            {items.map((item) => (
              <div key={item.menuItemId} style={{
                display: "flex", alignItems: "center", gap: 8,
                marginBottom: 10,
              }}>
                <VegDot isVeg={item.isVeg} />
                <span style={{ flex: 1, fontSize: "0.88rem", color: INK, fontWeight: 500 }}>
                  {item.name}
                  {item.quantity > 1 && (
                    <span style={{ color: INK_MUTED, fontWeight: 400 }}> ×{item.quantity}</span>
                  )}
                </span>
                <span style={{ fontSize: "0.88rem", color: INK, fontWeight: 600 }}>
                  ₹{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div style={{ paddingTop: 14, borderTop: `1px solid ${INK_HAIR}` }}>
            {[
              { label: "Subtotal", value: `₹${total.toFixed(0)}` },
              { label: "Delivery fee", value: deliveryFee===0?"FREE":`₹${deliveryFee}` },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                fontSize: "0.84rem", color: INK_SOFT, marginBottom: 8,
              }}>
                <span>{row.label}</span><span>{row.value}</span>
              </div>
            ))}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontSize: "1rem", fontWeight: 700, color: INK,
              borderTop: `1px solid ${INK_HAIR}`, paddingTop: 12, marginTop: 4,
            }}>
              <span>Total</span>
              <span style={{ color: TERRACOTTA_DEEP, fontFamily: "var(--font-display)" }}>
                ₹{grandTotal}
              </span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing || addresses.length === 0}
            style={{
              width: "100%", padding: "16px", marginTop: 20,
              borderRadius: 12, border: "none",
              background: placing || addresses.length === 0
                ? "rgba(43,29,18,0.14)"
                : `linear-gradient(135deg, ${TERRACOTTA_SOFT}, ${TERRACOTTA} 55%, ${TERRACOTTA_DEEP})`,
              color: placing || addresses.length === 0 ? INK_MUTED : "#FFF5E6",
              fontSize: "0.95rem", fontWeight: 600,
              fontFamily: "var(--font-sans)",
              cursor: placing || addresses.length === 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: placing ? "none" : `0 6px 20px ${TERRACOTTA}40`,
              transition: "all 0.2s",
            }}
          >
            {placing
              ? <><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Placing order...</>
              : `Place order · ₹${grandTotal}`
            }
          </button>

          <p style={{
            fontSize: "0.72rem", color: INK_MUTED, textAlign: "center",
            marginTop: 12, lineHeight: 1.5,
          }}>
            Payment will be deducted from your wallet
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fade-up { from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .checkout-grid > div:last-child {
            position: relative !important;
            top: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
