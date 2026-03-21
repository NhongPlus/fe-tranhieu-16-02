// File: src/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }: { children: any }) {
  const user = localStorage.getItem("token");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}