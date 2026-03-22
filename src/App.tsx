import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./page/Login";
import Register from "./page/Register";
import Dashboard from "./page/Dashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import CreateEvent from "./page/CreateEvent";
import Transcript from "./page/Transcript";
import Gpapage from "./page/Gpapage";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} /> {/* Thêm dòng này */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/gpa" element={<Gpapage />} />
        <Route
          path="/transcript"
          element={
            <ProtectedRoute>
              <Transcript />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/create-event" element={<CreateEvent />} />
      </Routes>
    </BrowserRouter>
  );
}