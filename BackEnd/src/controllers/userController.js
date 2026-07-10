const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const xss = require("xss");

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Hash "morto" (sem usuário correspondente) usado para igualar o tempo de resposta do login
// quando o e-mail não existe — evita que a diferença de tempo revele se a conta existe.
const DUMMY_HASH = bcrypt.hashSync("timing-attack-guard", 12);

// Converte strings tipo "24h", "7d", "30m" (mesmo formato aceito pelo JWT_EXPIRES_IN) para
// milissegundos, para usar como maxAge do cookie de sessão.
function parseDurationMs(value, fallbackMs) {
  const match = /^(\d+)\s*(ms|s|m|h|d)?$/i.exec(String(value ?? "").trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unitMs = { ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000 }[(match[2] || "ms").toLowerCase()];
  return amount * unitMs;
}

const COOKIE_MAX_AGE = parseDurationMs(TOKEN_EXPIRES_IN, 24 * 60 * 60 * 1000);
const COOKIE_NAME = "token";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const issueToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: TOKEN_EXPIRES_IN });
};

// Envia o JWT como cookie httpOnly (não acessível via JavaScript no navegador) em vez de no
// corpo da resposta — mitiga roubo de token via XSS, já que o token nunca chega ao localStorage.
const sendAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: COOKIE_MAX_AGE });
};

const publicUser = (user) => {
  const raw = user.toJSON ? user.toJSON() : { ...user };
  delete raw.senha;
  return raw;
};

// 🔹 Registro de novo usuário
exports.register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ message: "Nome, email e senha são obrigatórios" });
    }

    if (senha.length < 8) {
      return res.status(400).json({ message: "Senha deve ter no mínimo 8 caracteres" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    // Gera o hash antes de checar duplicidade: o custo do bcrypt domina o tempo da requisição,
    // então a resposta demora praticamente o mesmo tempo esteja o e-mail livre ou já cadastrado
    // (dificulta enumerar e-mails cadastrados só observando o tempo de resposta).
    const senhaHash = await bcrypt.hash(senha, 12);

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const user = await User.create({
      nome: xss(nome),
      email: email.toLowerCase(),
      senha: senhaHash,
    });

    const token = issueToken(user);
    sendAuthCookie(res, token);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    console.error("Erro no registro:", err);
    res.status(500).json({ message: "Erro ao registrar" });
  }
};

// 🔹 Autenticação: valida email/senha e gera token JWT
exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha obrigatórios" });
    }

    const user = await User.findOne({ where: { email: String(email).toLowerCase() } });

    // Sempre roda bcrypt.compare (com um hash morto quando o usuário não existe) para que o
    // tempo de resposta não denuncie se o e-mail está cadastrado.
    const isPasswordValid = await bcrypt.compare(senha, user ? user.senha : DUMMY_HASH);
    if (!user || !isPasswordValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = issueToken(user);
    sendAuthCookie(res, token);
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
};

// 🔹 Encerra a sessão limpando o cookie do token
exports.logout = (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  res.status(204).send();
};

// 🔹 Retorna o perfil do usuário autenticado
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(publicUser(user));
  } catch (err) {
    console.error("Erro ao buscar perfil:", err);
    res.status(500).json({ message: "Erro ao buscar perfil" });
  }
};

// 🔹 Atualiza dados do próprio perfil (nome)
exports.updateMe = async (req, res) => {
  try {
    const { nome } = req.body;
    const updateData = {};

    if (nome !== undefined) updateData.nome = xss(nome);

    await User.update(updateData, { where: { id: req.userId } });

    const updatedUser = await User.findByPk(req.userId);
    res.json(publicUser(updatedUser));
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
};
