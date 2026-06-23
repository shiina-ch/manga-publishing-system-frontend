import { Navigate, Outlet, useLocation } from "react-router";
import { tokenStorage } from "../../storage/tokenStorage";

/**
 * Guard route — bọc các trang yêu cầu đăng nhập.
 *
 * Chưa login  → redirect về "/" và lưu trang đang truy cập vào state.from
 * Đã login    → render children thông qua <Outlet />
 */
export function ProtectedRoute() {
  const location = useLocation();

  if (!tokenStorage.isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
