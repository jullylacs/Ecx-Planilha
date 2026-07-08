const { Trade } = require("../models");

const ATIVOS = ["WIN", "WDO"];
const OPERACOES = ["Compra", "Venda"];

// Dados de exemplo usados pelo botão "Exemplo" do diário
const SEED_TRADES = [
  { data: "2026-06-01", ativo: "WIN", operacao: "Compra", contratos: 2, entrada: 132000, saida: 132150 },
  { data: "2026-06-01", ativo: "WIN", operacao: "Venda", contratos: 1, entrada: 132400, saida: 132250 },
  { data: "2026-06-02", ativo: "WIN", operacao: "Compra", contratos: 3, entrada: 131800, saida: 131700 },
  { data: "2026-06-03", ativo: "WIN", operacao: "Compra", contratos: 2, entrada: 133000, saida: 133300 },
  { data: "2026-06-04", ativo: "WDO", operacao: "Venda", contratos: 1, entrada: 5250.5, saida: 5245.0 },
  { data: "2026-06-05", ativo: "WIN", operacao: "Compra", contratos: 5, entrada: 130500, saida: 130400 },
  { data: "2026-06-08", ativo: "WIN", operacao: "Venda", contratos: 2, entrada: 134000, saida: 133700 },
];

const validateTradeInput = (body) => {
  const { data, ativo, operacao, contratos, entrada, saida } = body || {};

  if (!data) return "Data é obrigatória";
  if (!ATIVOS.includes(ativo)) return "Ativo inválido";
  if (!OPERACOES.includes(operacao)) return "Operação inválida";

  const contratosNum = Number(contratos);
  if (!Number.isFinite(contratosNum) || contratosNum <= 0) return "Contratos inválidos";

  const entradaNum = Number(entrada);
  const saidaNum = Number(saida);
  if (!Number.isFinite(entradaNum) || !Number.isFinite(saidaNum)) return "Entrada/saída inválidas";

  return null;
};

const buildTradePayload = (body, userId) => ({
  data: body.data,
  ativo: body.ativo,
  operacao: body.operacao,
  contratos: Number(body.contratos),
  entrada: Number(body.entrada),
  saida: Number(body.saida),
  user_id: userId,
});

// 🔹 Lista todas as operações do usuário autenticado
exports.getTrades = async (req, res) => {
  try {
    const trades = await Trade.findAll({
      where: { user_id: req.userId },
      order: [["data", "ASC"], ["id", "ASC"]],
    });
    res.json(trades);
  } catch (err) {
    console.error("Erro ao listar operações:", err);
    res.status(500).json({ message: "Erro ao listar operações" });
  }
};

// 🔹 Cria uma nova operação para o usuário autenticado
exports.createTrade = async (req, res) => {
  try {
    const error = validateTradeInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const trade = await Trade.create(buildTradePayload(req.body, req.userId));
    res.status(201).json(trade);
  } catch (err) {
    console.error("Erro ao criar operação:", err);
    res.status(500).json({ message: "Erro ao criar operação" });
  }
};

// 🔹 Atualiza uma operação existente (somente do próprio usuário)
exports.updateTrade = async (req, res) => {
  try {
    const trade = await Trade.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!trade) return res.status(404).json({ message: "Operação não encontrada" });

    const error = validateTradeInput(req.body);
    if (error) return res.status(400).json({ message: error });

    await trade.update(buildTradePayload(req.body, req.userId));
    res.json(trade);
  } catch (err) {
    console.error("Erro ao atualizar operação:", err);
    res.status(500).json({ message: "Erro ao atualizar operação" });
  }
};

// 🔹 Remove uma operação (somente do próprio usuário)
exports.deleteTrade = async (req, res) => {
  try {
    const deletedRows = await Trade.destroy({ where: { id: req.params.id, user_id: req.userId } });
    if (!deletedRows) return res.status(404).json({ message: "Operação não encontrada" });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao remover operação:", err);
    res.status(500).json({ message: "Erro ao remover operação" });
  }
};

// 🔹 Remove todas as operações do usuário autenticado (botão "Limpar")
exports.clearTrades = async (req, res) => {
  try {
    await Trade.destroy({ where: { user_id: req.userId } });
    res.status(204).send();
  } catch (err) {
    console.error("Erro ao limpar operações:", err);
    res.status(500).json({ message: "Erro ao limpar operações" });
  }
};

// 🔹 Substitui as operações do usuário pelos dados de exemplo (botão "Exemplo")
exports.seedTrades = async (req, res) => {
  try {
    await Trade.destroy({ where: { user_id: req.userId } });
    const created = await Trade.bulkCreate(
      SEED_TRADES.map((t) => ({ ...t, user_id: req.userId }))
    );
    res.status(201).json(created);
  } catch (err) {
    console.error("Erro ao gerar operações de exemplo:", err);
    res.status(500).json({ message: "Erro ao gerar operações de exemplo" });
  }
};
