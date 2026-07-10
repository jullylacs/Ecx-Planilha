"use strict";

// Migration: adiciona coluna financeiro (R$) preenchida manualmente, independente de pontos
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("daily_results", "financeiro", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("daily_results", "financeiro");
  },
};
