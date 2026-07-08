import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { C } from "../theme";

const getApiErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const register = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const res = await api.post("/users/register", { nome, email, senha });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Erro ao registrar"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") register();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: C.bg }}>
      <div style={{ background: C.panel1, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.roxoMed}`, padding: 40, borderRadius: 14, width: "100%", maxWidth: 380, textAlign: "center" }}>
        <h1 style={{ color: C.branco, marginBottom: 4, fontSize: 24 }}>Criar conta</h1>
        <p style={{ color: C.cinza, marginBottom: 28, fontSize: 13 }}>Diário de Operações — mini índice</p>

        {errorMessage && (
          <div style={{ padding: "10px 12px", marginBottom: 16, borderRadius: 8, background: "rgba(244,63,94,0.12)", border: `1px solid ${C.vermelho}`, color: C.vermelho, fontSize: 13, textAlign: "left" }}>
            {errorMessage}
          </div>
        )}

        <input
          placeholder="Nome" type="text" value={nome}
          onChange={(e) => setNome(e.target.value)} onKeyDown={handleKeyPress}
          style={{ width: "100%", padding: "12px 14px", marginBottom: 14, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel2, color: C.branco, fontSize: 14, boxSizing: "border-box" }}
        />

        <input
          placeholder="Email" type="email" value={email}
          onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress}
          style={{ width: "100%", padding: "12px 14px", marginBottom: 14, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel2, color: C.branco, fontSize: 14, boxSizing: "border-box" }}
        />

        <input
          placeholder="Senha (mín. 6 caracteres)" type="password" value={senha}
          onChange={(e) => setSenha(e.target.value)} onKeyDown={handleKeyPress}
          style={{ width: "100%", padding: "12px 14px", marginBottom: 18, borderRadius: 8, border: `1px solid ${C.border}`, background: C.panel2, color: C.branco, fontSize: 14, boxSizing: "border-box" }}
        />

        <button
          onClick={register} disabled={loading}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "none", background: C.roxoMed, color: C.branco, fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginBottom: 16 }}
        >
          {loading ? "Criando..." : "Criar conta"}
        </button>

        <div style={{ fontSize: 13, color: C.cinza }}>
          Já tem conta?{" "}
          <Link to="/login" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
            Entrar
          </Link>
        </div>
      </div>
    </div>
  );
}
