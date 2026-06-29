import AdminDashboard from "../components/admin/AdminDashboard";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  );
}
