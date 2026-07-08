const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 🔹 Model de operações (trades) do diário
const Trade = sequelize.define("Trade", {

  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  ativo: {
    type: DataTypes.ENUM("WIN", "WDO"),
    allowNull: false,
    defaultValue: "WIN"
  },

  operacao: {
    type: DataTypes.ENUM("Compra", "Venda"),
    allowNull: false,
    defaultValue: "Compra"
  },

  contratos: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  entrada: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  saida: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: "users", key: "id" },
    onDelete: "CASCADE"
  }

}, {
  tableName: "trades",
  timestamps: true
});

module.exports = Trade;
