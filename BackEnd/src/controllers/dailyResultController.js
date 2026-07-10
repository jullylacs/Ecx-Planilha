const { DailyResult } = require("../models");

// Valor do ponto do mini índice (WIN) na B3, em R$
const POINT_VALUE = 0.2;

// Dados de exemplo usados pelo botão "Exemplo" do diário — fechamentos diários (mini índice)
const SEED_DAILY_RESULTS = [
  { data: "2026-05-04", pontos: 85, financeiro: 17 },
  { data: "2026-05-06", pontos: -40, financeiro: -8 },
  { data: "2026-05-11", pontos: 120, financeiro: 24 },
  { data: "2026-05-13", pontos: 60, financeiro: 12 },
  { data: "2026-05-20", pontos: -95, financeiro: -19 },
  { data: "2026-06-01", pontos: 150, financeiro: 30 },
  { data: "2026-06-03", pontos: -30, financeiro: -6 },
  { data: "2026-06-10", pontos: 75, financeiro: 15 },
  { data: "2026-06-17", pontos: -60, financeiro: -12 },
  { data: "2026-06-24", pontos: 200, financeiro: 40 },
  { data: "2026-07-01", pontos: -45, financeiro: -9 },
  { data: "2026-07-06", pontos: 110, financeiro: 22 },
];

const validateInput = (body) => {
  const { data, pontos, financeiro } = body || {};

  if (!data) return "Data é obrigatória";

  const pontosNum = Number(pontos);
  if (!Number.isFinite(pontosNum)) return "Pontos inválidos";

  if (financeiro !== undefined && financeiro !== null && financeiro !== "") {
    const financeiroNum = Number(financeiro);
    if (!Number.isFinite(financeiroNum)) return "Financeiro inválido";
  }

  return null;
};

const buildPayload = (body, userId) => ({
  data: body.data,
  pontos: Number(body.pontos),
  financeiro:
    body.financeiro !== undefined && body.financeiro !== null && body.financeiro !== ""
      ? Number(body.financeiro)
      : null,
  user_id: userId,
});

const isUniqueConstraintError = (err) => err?.name === "SequelizeUniqueConstraintError";

// 🔹 Lista todos os fechamentos diários do usuário autenticado
exports.getAll = async (req, res) => {
  try {
    const results = await DailyResult.findAll({
      where: { user_id: req.userId },
      order: [["data", "ASC"], ["id", "ASC"]],
    });
    res.json(results);
  } catch (err) {
    console.error("Erro ao listar fechamentos:", err);
    res.status(500).json({ message: "Erro ao listar fechamentos" });
  }
};

// 🔹 Cria um novo fechamento diário para o usuário autenticado
exports.create = async (req, res) => {
  try {
    const error = validateInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const result = await DailyResult.create(buildPayload(req.body, req.userId));
    res.status(201).json(result);
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return res.status(409).json({ message: "Já existe um fechamento para esta data" });
    }
    console.error("Erro ao criar fechamento:", err);
    res.status(500).json({ message: "Erro ao criar fechamento" });
  }
};

// 🔹 Atualiza um fechamento existente (somente do próprio usuário)
exports.update = async (req, res) => {
  try {
    const result = await DailyResult.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!result) return res.status(404).json({ message: "Fechamento não encontrado" });

    const error = validateInput(req.body);
    if (error) return res.status(400).json({ message: error });

    await result.update(buildPayload(req.body, req.userId));
    res.json(result);
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return res.status(409).json({ message: "Já existe um fechamento para esta data" });
    }
    console.error("Erro ao atualizar fechamento:", err);
    res.status(500).json({ message: "Erro ao atualizar fechamento" });
  }
};

// 🔹 Remove um fechamento (somente do próprio usuário)
exports.remove = async (req, res) => {
  try {
    const deletedRows = await DailyResult.destroy({ where: { id: req.params.id, user_id: req.userId } });
    if (!deletedRows) return res.status(404).json({ message: "Fechamento não encontrado" });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao remover fechamento:", err);
    res.status(500).json({ message: "Erro ao remover fechamento" });
  }
};

// 🔹 Remove todos os fechamentos do usuário autenticado (botão "Limpar")
exports.clearAll = async (req, res) => {
  try {
    await DailyResult.destroy({ where: { user_id: req.userId } });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao limpar fechamentos:", err);
    res.status(500).json({ message: "Erro ao limpar fechamentos" });
  }
};

// 🔹 Substitui os fechamentos do usuário pelos dados de exemplo (botão "Exemplo")
exports.seed = async (req, res) => {
  try {
    await DailyResult.destroy({ where: { user_id: req.userId } });
    const created = await DailyResult.bulkCreate(
      SEED_DAILY_RESULTS.map((r) => ({ ...r, user_id: req.userId }))
    );
    res.status(201).json(created);
  } catch (err) {
    console.error("Erro ao gerar fechamentos de exemplo:", err);
    res.status(500).json({ message: "Erro ao gerar fechamentos de exemplo" });
  }
};

exports.POINT_VALUE = POINT_VALUE;
