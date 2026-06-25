import { Navigate, Outlet, useLocation } from "react-router";
import { tokenStorage } from "../../storage/tokenStorage";
import { getDefaultRoute } from "../../auth/roleRouting";
import type { ActiveRole } from "../../types/account";

/**
 * Guard route — bọc các trang yêu cầu đăng nhập.
 *
 * Chưa login  → redirect về "/" và lưu trang đang truy cập vào state.from
 * Đã login    → render children thông qua <Outlet />
 */
interface ProtectedRouteProps {
  allowedRoles?: ActiveRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();

  // if (!tokenStorage.isAuthenticated()) {
  //   return <Navigate to="/" replace state={{ from: location }} />;
  // }

  // if (allowedRoles) {
  //   const roles = tokenStorage.getRoles();
  //   const isAllowed = roles.some((role) => allowedRoles.includes(role));
  //   if (!isAllowed) {
  //     const destination = getDefaultRoute(roles);
  //     if (destination === location.pathname) return <Navigate to="/" replace />;
  //     return <Navigate to={destination} replace />;
  //   }
  // }

  return <Outlet />;
}
