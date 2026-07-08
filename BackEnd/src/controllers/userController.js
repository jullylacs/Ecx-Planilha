const { User } = require("../models");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const xss = require("xss");

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const issueToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET não configurado");
  return jwt.sign({ id: user.id, email: user.email }, secret, { expiresIn: TOKEN_EXPIRES_IN });
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

    if (senha.length < 6) {
      return res.status(400).json({ message: "Senha deve ter no mínimo 6 caracteres" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Email inválido" });
    }

    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      return res.status(409).json({ message: "Email já cadastrado" });
    }

    const senhaHash = await bcrypt.hash(senha, 12);
    const user = await User.create({
      nome: xss(nome),
      email: email.toLowerCase(),
      senha: senhaHash,
    });

    const token = issueToken(user);
    res.status(201).json({ user: publicUser(user), token });
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
    if (!user) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const isPasswordValid = await bcrypt.compare(senha, user.senha);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    const token = issueToken(user);
    res.json({ user: publicUser(user), token });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ message: "Erro no servidor" });
  }
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

// 🔹 Atualiza dados do próprio perfil (nome e/ou custo por operação)
exports.updateMe = async (req, res) => {
  try {
    const { nome, custo_operacao } = req.body;
    const updateData = {};

    if (nome !== undefined) updateData.nome = xss(nome);

    if (custo_operacao !== undefined) {
      const parsed = Number(custo_operacao);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return res.status(400).json({ message: "Custo por operação inválido" });
      }
      updateData.custo_operacao = parsed;
    }

    await User.update(updateData, { where: { id: req.userId } });

    const updatedUser = await User.findByPk(req.userId);
    res.json(publicUser(updatedUser));
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ message: "Erro ao atualizar perfil" });
  }
};
