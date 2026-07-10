import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Lock } from "lucide-react";
import api from "../services/api";
import { C } from "../theme";
import { AuthShell, AuthInput, AuthButton } from "../components/AuthShell";

const getApiErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [senha, setSenha] = useState("");
  const [confirmSenha, setConfirmSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async () => {
    if (senha !== confirmSenha) {
      setErrorMessage("As senhas não coincidem");
      return;
    }
    try {
      setLoading(true);
      setErrorMessage("");
      await api.post("/users/reset-password", { token, senha });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Erro ao redefinir senha"));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") submit();
  };

  if (!token) {
    return (
      <AuthShell
        title="Link inválido"
        subtitle="Diário de Operações — mini índice"
        footer={
          <Link to="/forgot-password" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
            Solicitar um novo link
          </Link>
        }
      >
        <p style={{ color: C.cinza, fontSize: 13, textAlign: "left", lineHeight: 1.5 }}>
          Esse link de redefinição está incompleto ou inválido. Peça um novo na tela de recuperação de senha.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nova senha"
      subtitle="Diário de Operações — mini índice"
      error={errorMessage}
      footer={
        <Link to="/login" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
          Voltar para o login
        </Link>
      }
    >
      {done ? (
        <p style={{ color: C.cinza, fontSize: 13, textAlign: "left", lineHeight: 1.5 }}>
          Senha redefinida com sucesso! Redirecionando para o login...
        </p>
      ) : (
        <>
          <AuthInput icon={Lock} placeholder="Nova senha (mín. 8 caracteres)" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} onKeyDown={handleKeyPress} />
          <AuthInput icon={Lock} placeholder="Confirme a nova senha" type="password" value={confirmSenha} onChange={(e) => setConfirmSenha(e.target.value)} onKeyDown={handleKeyPress} />
          <AuthButton onClick={submit} loading={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </AuthButton>
        </>
      )}
    </AuthShell>
  );
}
