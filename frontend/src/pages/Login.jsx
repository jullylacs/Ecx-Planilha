import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import api from "../services/api";
import { C } from "../theme";
import { AuthShell, AuthInput, AuthButton } from "../components/AuthShell";

const getApiErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await api.post("/users/login", { email, senha });
      // A sessão vive num cookie httpOnly (definido pelo backend); aqui só guardamos os dados
      // do usuário para exibição na UI (nome no topo), nunca o token.
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Erro ao conectar"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") login();
  };

  return (
    <AuthShell
      title="Diário de Operações"
      subtitle="mini índice"
      error={errorMessage}
      footer={
        <>
          Não tem conta?{" "}
          <Link to="/register" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
            Registre-se
          </Link>
        </>
      }
    >
      <AuthInput icon={Mail} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress} />
      <AuthInput icon={Lock} placeholder="Senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={handleKeyPress} />
      <AuthButton onClick={login} loading={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </AuthButton>
    </AuthShell>
  );
}
