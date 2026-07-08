"use strict";

// Migration: cria a tabela de operações (trades) do diário
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("trades", {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      data:       { type: Sequelize.DATEONLY, allowNull: false },
      ativo:      { type: Sequelize.ENUM("WIN", "WDO"), allowNull: false, defaultValue: "WIN" },
      operacao:   { type: Sequelize.ENUM("Compra", "Venda"), allowNull: false, defaultValue: "Compra" },
      contratos:  { type: Sequelize.INTEGER, allowNull: false },
      entrada:    { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      saida:      { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE"
      },
      createdAt:  { type: Sequelize.DATE, allowNull: false },
      updatedAt:  { type: Sequelize.DATE, allowNull: false }
    });

    await queryInterface.addIndex("trades", ["user_id", "data"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("trades");
  }
};
