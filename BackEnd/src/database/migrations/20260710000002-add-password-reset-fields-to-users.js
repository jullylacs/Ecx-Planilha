"use strict";

// Migration: adiciona campos para o fluxo de "esqueci minha senha"
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "resetPasswordTokenHash", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("users", "resetPasswordExpires", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn("users", "resetPasswordTokenHash");
    await queryInterface.removeColumn("users", "resetPasswordExpires");
  },
};
