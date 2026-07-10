import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Mail, Lock } from "lucide-react";
import api from "../services/api";
import { C } from "../theme";
import { AuthShell, AuthInput, AuthButton } from "../components/AuthShell";

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
    <AuthShell
      title="Criar conta"
      subtitle="Diário de Operações — mini índice"
      error={errorMessage}
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
            Entrar
          </Link>
        </>
      }
    >
      <AuthInput icon={User} placeholder="Nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)} onKeyDown={handleKeyPress} />
      <AuthInput icon={Mail} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress} />
      <AuthInput icon={Lock} placeholder="Senha (mín. 6 caracteres)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={handleKeyPress} />
      <AuthButton onClick={register} loading={loading}>
        {loading ? "Criando..." : "Criar conta"}
      </AuthButton>
    </AuthShell>
  );
}
