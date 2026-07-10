import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import api from "../services/api";
import { C } from "../theme";
import { AuthShell, AuthInput, AuthButton } from "../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submit = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      // O backend sempre responde com a mesma mensagem genérica, exista ou não o e-mail —
      // então aqui só mostramos essa confirmação, sem revelar se a conta existe.
      await api.post("/users/forgot-password", { email });
      setSent(true);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Erro ao solicitar redefinição");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") submit();
  };

  return (
    <AuthShell
      title="Esqueceu a senha?"
      subtitle="Diário de Operações — mini índice"
      error={errorMessage}
      footer={
        <Link to="/login" style={{ color: C.roxoClaro, fontWeight: 700, textDecoration: "none" }}>
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <p style={{ color: C.cinza, fontSize: 13, textAlign: "left", marginBottom: 16, lineHeight: 1.5 }}>
          Se o e-mail <strong style={{ color: C.branco }}>{email}</strong> estiver cadastrado, você vai
          receber um link para redefinir sua senha em instantes. Confira também a caixa de spam.
        </p>
      ) : (
        <>
          <p style={{ color: C.cinza, fontSize: 13, textAlign: "left", marginBottom: 16, lineHeight: 1.5 }}>
            Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
          </p>
          <AuthInput icon={Mail} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleKeyPress} />
          <AuthButton onClick={submit} loading={loading}>
            {loading ? "Enviando..." : "Enviar link de redefinição"}
          </AuthButton>
        </>
      )}
    </AuthShell>
  );
}
