const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 🔹 Model de usuários do sistema
const User = sequelize.define("User", {

  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },

  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },

  senha: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Custo fixo por contrato operado (R$), usado no cálculo do líquido
  custo_operacao: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 1.5
  }

}, {
  tableName: "users",
  timestamps: true
});

module.exports = User;
