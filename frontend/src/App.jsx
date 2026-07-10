import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Diario from "./pages/Diario";

function PrivateRoute({ children }) {
  // A sessão real é validada pelo backend via cookie httpOnly em cada request; isto aqui é só
  // uma checagem de UX para não piscar a página protegida antes de redirecionar. Se o cookie
  // estiver ausente/expirado, a primeira chamada à API retorna 401 e o interceptor do axios
  // já força o redirecionamento para /login.
  const hasUser = Boolean(localStorage.getItem("user"));
  if (!hasUser) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Diario />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
