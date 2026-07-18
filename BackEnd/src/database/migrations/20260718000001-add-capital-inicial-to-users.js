"use strict";

// Migration: adiciona o capital inicial do usuário (soma ao resultado acumulado para formar o capital atual)
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "capital_inicial", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("users", "capital_inicial");
  }
};
