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

  // Hash SHA-256 do token de redefinição de senha (o token em si só existe no e-mail do
  // usuário) e prazo de validade — nunca guardamos o token em texto puro no banco.
  resetPasswordTokenHash: {
    type: DataTypes.STRING,
    allowNull: true
  },

  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  }

}, {
  tableName: "users",
  timestamps: true
});

module.exports = User;
