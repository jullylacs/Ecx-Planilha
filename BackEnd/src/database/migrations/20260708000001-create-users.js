"use strict";

// Migration: cria a tabela de usuários do sistema
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id:              { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      nome:            { type: Sequelize.STRING, allowNull: false },
      email:           { type: Sequelize.STRING, allowNull: false, unique: true },
      senha:           { type: Sequelize.STRING, allowNull: false }, // hash bcrypt
      custo_operacao:  { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 1.5 },
      createdAt:       { type: Sequelize.DATE, allowNull: false },
      updatedAt:       { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable("users");
  }
};
