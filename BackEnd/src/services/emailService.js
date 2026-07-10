const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function buildResetPasswordHtml(resetUrl) {
  return `
    <div style="background:#0E0E13;padding:32px 16px;font-family:sans-serif;">
      <div style="max-width:420px;margin:0 auto;background:#1B1B24;border:1px solid #38384A;border-radius:16px;padding:32px;">
        <h1 style="color:#F4F4F5;font-size:18px;margin:0 0 16px;">Redefinição de senha</h1>
        <p style="color:#A1A1AA;font-size:14px;line-height:1.5;margin:0 0 24px;">
          Recebemos um pedido para redefinir a senha da sua conta no Diário de Operações.
          Se foi você, clique no botão abaixo. O link expira em 1 hora.
        </p>
        <a href="${resetUrl}"
           style="display:inline-block;background:#8B5CF6;color:#fff;text-decoration:none;
                  font-weight:bold;font-size:14px;padding:12px 20px;border-radius:8px;">
          Redefinir senha
        </a>
        <p style="color:#A1A1AA;font-size:12px;line-height:1.5;margin:24px 0 0;">
          Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.
        </p>
      </div>
    </div>
  `;
}

// Envia o e-mail de redefinição de senha. Falhas são logadas e engolidas pelo chamador:
// o endpoint de forgot-password sempre responde com a mesma mensagem genérica, esteja o
// e-mail configurado corretamente ou não, para não vazar detalhes de infraestrutura.
async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    console.error("RESEND_API_KEY não configurado — e-mail de redefinição não enviado");
    return;
  }

  const { error } = await resend.emails.send({
    from: fromEmail,
    to,
    subject: "Redefinição de senha — Diário de Operações",
    html: buildResetPasswordHtml(resetUrl),
  });

  if (error) {
    console.error("Erro ao enviar e-mail de redefinição:", error);
  }
}

module.exports = { sendPasswordResetEmail };
