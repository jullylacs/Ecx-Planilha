const nodemailer = require("nodemailer");

// Envia via SMTP do Gmail — não exige verificar domínio (diferente de serviços tipo Resend),
// só uma conta Gmail com verificação em 2 etapas e uma "senha de app" (myaccount.google.com/apppasswords).
const transporter = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
  ? nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    })
  : null;
const fromEmail = process.env.GMAIL_USER;

// Um e-mail com "cartão" escuro + botão grande estilizado (like a página do site) bate demais
// no padrão que o filtro anti-phishing do Gmail associa a phishing quando o remetente é uma
// conta pessoal — ele descarta silenciosamente (nem cai no spam). Um layout mais discreto
// (título + link em texto, sem cartão/botão) mantém a identidade visual (roxo do site) e passa.
function buildResetPasswordHtml(resetUrl) {
  return `
    <div style="font-family: -apple-system, 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 8px;">
      <p style="font-size:13px; letter-spacing:0.08em; text-transform:uppercase; color:#8B5CF6; font-weight:700; margin:0 0 4px;">
        Diário de Operações
      </p>
      <h2 style="color:#1B1B24; font-size:19px; margin:0 0 16px;">Redefinição de senha</h2>
      <p style="font-size:14px; line-height:1.6; color:#3F3F46; margin:0 0 12px;">
        Recebemos um pedido para redefinir a senha da sua conta. Se foi você, acesse o link abaixo
        para escolher uma nova senha (válido por 1 hora):
      </p>
      <p style="margin:20px 0;">
        <a href="${resetUrl}" style="color:#7C3AED; font-weight:600; font-size:14px;">Redefinir minha senha →</a>
      </p>
      <p style="font-size:12px; line-height:1.5; color:#A1A1AA; margin:24px 0 0; border-top:1px solid #E4E4E7; padding-top:16px;">
        Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.
      </p>
    </div>
  `;
}

function buildResetPasswordText(resetUrl) {
  return `Diário de Operações — Redefinição de senha

Recebemos um pedido para redefinir a senha da sua conta. Se foi você, acesse o link abaixo (válido por 1 hora):
${resetUrl}

Se você não pediu isso, pode ignorar este e-mail — sua senha continua a mesma.`;
}

// Envia o e-mail de redefinição de senha. Falhas são logadas e engolidas pelo chamador:
// o endpoint de forgot-password sempre responde com a mesma mensagem genérica, esteja o
// e-mail configurado corretamente ou não, para não vazar detalhes de infraestrutura.
async function sendPasswordResetEmail(to, resetUrl) {
  if (!transporter) {
    console.error("GMAIL_USER/GMAIL_APP_PASSWORD não configurados — e-mail de redefinição não enviado");
    return;
  }

  try {
    await transporter.sendMail({
      from: `Diário de Operações <${fromEmail}>`,
      to,
      subject: "Redefinição de senha — Diário de Operações",
      html: buildResetPasswordHtml(resetUrl),
      text: buildResetPasswordText(resetUrl),
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail de redefinição:", error);
  }
}

module.exports = { sendPasswordResetEmail };
