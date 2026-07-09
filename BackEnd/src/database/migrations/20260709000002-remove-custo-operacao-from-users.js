"use strict";

// Migration: remove o custo por operação (não se aplica mais ao modelo de fechamento diário)
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("users", "custo_operacao");
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "custo_operacao", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 1.5
    });
  }
};
