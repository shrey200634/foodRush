import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import RestaurantDetailPage from "./pages/RestaurantDetailPage";
import ProfilePage from "./pages/ProfilePage";
import AddressesPage from "./pages/AddressesPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WalletPage from "./pages/WalletPage";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import OwnerDashboard from "./pages/OwnerDashboard";
import DriverDashboard from "./pages/DriverDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"      element={<LoginPage />} />
      <Route path="/register"   element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />

      {/* Protected — all under AppLayout (Navbar + main) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Customer routes */}
        <Route path="/"                       element={<HomePage />} />
        <Route path="/search"                 element={<SearchPage />} />
        <Route path="/restaurants/:id"        element={<RestaurantDetailPage />} />
        <Route path="/profile"                element={<ProfilePage />} />
        <Route path="/addresses"              element={<AddressesPage />} />
        <Route path="/checkout"               element={<CheckoutPage />} />
        <Route path="/orders"                 element={<OrdersPage />} />
        <Route path="/orders/:orderId"        element={<OrderDetailPage />} />
        <Route path="/wallet"                 element={<WalletPage />} />
        <Route path="/orders/:orderId/track"  element={<OrderTrackingPage />} />

        {/* Owner dashboard */}
        <Route path="/owner"           element={<OwnerDashboard />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />

        {/* Driver dashboard */}
        <Route path="/driver"           element={<DriverDashboard />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
