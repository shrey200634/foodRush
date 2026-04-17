import { useEffect, useState } from "react";
import { useOwnerStore } from "../store/ownerStore";
import { Loader2, Store, Clock, CheckCircle, Package, AlertTriangle, Search, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";

const INK = "#2B1D12";
const CARD = "#FFF9EC";
const TERRACOTTA = "#C14A2A";
const VEG = "#4A7C2B";

function VegDot({ isVeg }) {
  const c = isVeg ? VEG : "#A83232";
  return (
    <span style={{
      width: 10, height: 10, border: `1.5px solid ${c}`,
      borderRadius: 2, display: "inline-flex",
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{ width: 4, height: 4, borderRadius: "50%", background: c }} />
    </span>
  );
}

export default function OwnerDashboardPage() {
  const { 
    myRestaurant, activeOrders, menuItems, loading, 
    fetchMyRestaurant, fetchActiveOrders, fetchMenu, 
    acceptOrder, updateOrderStatus, toggleMenuItem 
  } = useOwnerStore();

  const [activeTab, setActiveTab] = useState("orders");
  const [init, setInit] = useState(false);

  useEffect(() => {
    const setup = async () => {
      const rest = await fetchMyRestaurant();
      if (rest) {
        await fetchActiveOrders();
        await fetchMenu();
      }
      setInit(true);
    };
    setup();
    
    // Poll for new orders every 10s
    const interval = setInterval(() => {
        if(useOwnerStore.getState().myRestaurant && activeTab === "orders") {
            useOwnerStore.getState().fetchActiveOrders();
        }
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!init || loading && !myRestaurant) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
      <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: TERRACOTTA }} />
    </div>;
  }

  if (!myRestaurant) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", background: CARD, borderRadius: 16 }}>
        <Store size={48} style={{ color: "rgba(43,29,18,0.2)", margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "1.5rem", color: INK, marginBottom: 8 }}>No Restaurant Linked</h2>
        <p style={{ color: "rgba(43,29,18,0.6)" }}>Your account is not registered as a restaurant owner.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", animation: "fade-up 0.4s ease-out" }}>
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
             <Store size={20} style={{ color: TERRACOTTA }} />
             <span style={{ fontWeight: 600, color: TERRACOTTA, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.8rem" }}>
                Owner Portal
             </span>
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "2.4rem", color: INK, letterSpacing: "-0.02em" }}>
            {myRestaurant.name}
          </h1>
          <p style={{ color: "rgba(43,29,18,0.6)", fontSize: "0.95rem" }}>
            {myRestaurant.isOpen ? "🟢 Accepting Orders" : "🔴 Currently Offline"}
          </p>
        </div>

        <div style={{ background: CARD, display: "flex", padding: 6, borderRadius: 12, border: "1px solid rgba(43,29,18,0.08)" }}>
          {["orders", "menu"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: activeTab === tab ? INK : "transparent",
              color: activeTab === tab ? "#FFF" : "rgba(43,29,18,0.6)",
              fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", transition: "all 0.2s"
            }}>
              {tab === "orders" ? "Live Orders" : "Menu"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "orders" && <OrdersTab orders={activeOrders} acceptOrder={acceptOrder} updateOrderStatus={updateOrderStatus} />}
      {activeTab === "menu" && <MenuTab menuItems={menuItems} toggleMenuItem={toggleMenuItem} />}

      <style>{`@keyframes fade-up { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

function OrdersTab({ orders, acceptOrder, updateOrderStatus }) {
  const pendingCount = orders.filter(o => o.status === "CREATED").length;
  
  const handleAccept = async (orderId) => {
      try {
          await acceptOrder(orderId, 15);
          toast.success("Order accepted!");
      } catch(err) {
          toast.error("Failed to accept order");
      }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
        await updateOrderStatus(orderId, newStatus);
        toast.success(`Order marked as ${newStatus}`);
    } catch(err) {
        toast.error("Failed to update status");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ background: `${TERRACOTTA}10`, padding: "16px 24px", borderRadius: 12, border: `1px solid ${TERRACOTTA}30` }}>
           <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: TERRACOTTA, marginBottom: 6 }}>Action Required</h3>
           <div style={{ fontSize: "2rem", fontFamily: "var(--font-display)", color: TERRACOTTA }}>{pendingCount}</div>
        </div>
        <div style={{ background: CARD, padding: "16px 24px", borderRadius: 12, border: `1px solid rgba(43,29,18,0.08)` }}>
           <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", fontWeight: 700, color: "rgba(43,29,18,0.5)", marginBottom: 6 }}>In Kitchen</h3>
           <div style={{ fontSize: "2rem", fontFamily: "var(--font-display)", color: INK }}>{orders.length - pendingCount}</div>
        </div>
      </div>

      {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(43,29,18,0.4)" }}>
              <Package size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p>No active orders right now.</p>
          </div>
      ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {orders.map(order => (
                  <div key={order.orderId} style={{ 
                      background: CARD, padding: 24, borderRadius: 16, 
                      border: `1.5px solid ${order.status === "CREATED" ? TERRACOTTA : "rgba(43,29,18,0.08)"}`
                  }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                          <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                  <span style={{ 
                                      background: order.status === "CREATED" ? TERRACOTTA : `${VEG}20`,
                                      color: order.status === "CREATED" ? "#FFF" : VEG,
                                      padding: "4px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700
                                  }}>
                                      {order.status}
                                  </span>
                                  <span style={{ fontSize: "0.85rem", color: "rgba(43,29,18,0.5)", fontFamily: "monospace" }}>#{order.orderId.substring(0,8)}</span>
                              </div>
                              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, color: INK }}>{order.items?.length || 0} Items</h3>
                          </div>
                          <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: "1.4rem", fontFamily: "var(--font-display)", color: INK, margin: 0 }}>₹{order.totalAmount}</p>
                          </div>
                      </div>

                      <div style={{ background: "rgba(43,29,18,0.03)", padding: 16, borderRadius: 12, marginBottom: 20 }}>
                          {order.items?.map((item, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: idx === order.items.length-1 ? 0 : 8, fontSize: "0.9rem", color: INK }}>
                                  <span><span style={{ fontWeight: 600 }}>{item.quantity}x</span> {item.menuItemName}</span>
                                  <span>₹{item.totalPrice}</span>
                              </div>
                          ))}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                          {order.status === "CREATED" && (
                              <button onClick={() => handleAccept(order.orderId)} style={{
                                  padding: "12px 24px", borderRadius: 10, border: "none", background: TERRACOTTA, 
                                  color: "#FFF", fontWeight: 600, cursor: "pointer"
                              }}>
                                  Accept & Start Prep
                              </button>
                          )}
                          {order.status === "CONFIRMED" && (
                              <button onClick={() => handleStatusUpdate(order.orderId, "PREPARING")} style={{
                                  padding: "12px 24px", borderRadius: 10, border: "none", background: INK, 
                                  color: "#FFF", fontWeight: 600, cursor: "pointer"
                              }}>
                                  Mark as Preparing
                              </button>
                          )}
                           {order.status === "PREPARING" && (
                              <button onClick={() => handleStatusUpdate(order.orderId, "READY")} style={{
                                  padding: "12px 24px", borderRadius: 10, border: "none", background: VEG, 
                                  color: "#FFF", fontWeight: 600, cursor: "pointer"
                              }}>
                                  Mark as Ready for Pickup
                              </button>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}

function MenuTab({ menuItems, toggleMenuItem }) {
  const handleToggle = async (id, currentValue) => {
      try {
          await toggleMenuItem(id);
          toast.success(`Item marked as ${!currentValue ? "In Stock" : "Out of Stock"}`);
      } catch(err) {
          toast.error("Failed to update status");
      }
  }

  return (
    <div style={{ background: CARD, borderRadius: 16, border: "1px solid rgba(43,29,18,0.08)", overflow: "hidden" }}>
        {menuItems.map((item, idx) => (
            <div key={item.menuItemId} style={{ 
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "20px 24px", borderBottom: idx === menuItems.length - 1 ? "none" : "1px solid rgba(43,29,18,0.08)"
             }}>
                 <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                     <VegDot isVeg={item.isVeg} />
                     <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 600, color: item.inStock ? INK : "rgba(43,29,18,0.4)"}}>{item.name}</h4>
                        <p style={{ fontSize: "0.85rem", color: "rgba(43,29,18,0.5)"}}>₹{item.price}</p>
                     </div>
                 </div>
                 <div 
                    onClick={() => handleToggle(item.menuItemId, item.inStock)}
                    style={{ cursor: "pointer", color: item.inStock ? VEG : "rgba(43,29,18,0.3)", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: "0.85rem" }}
                 >
                     {item.inStock ? "IN STOCK" : "OUT OF STOCK"}
                     {item.inStock ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                 </div>
            </div>
        ))}
    </div>
  );
}
