"use strict";

// Migration: permite múltiplos fechamentos na mesma data (ex: mais de uma operação por dia).
// Troca o índice único (user_id, data) por um índice normal, mantendo a performance de
// consulta sem impedir mais de um lançamento no mesmo dia.
module.exports = {
  async up(queryInterface) {
    await queryInterface.removeIndex("daily_results", ["user_id", "data"]);
    await queryInterface.addIndex("daily_results", ["user_id", "data"]);
  },
  async down(queryInterface) {
    await queryInterface.removeIndex("daily_results", ["user_id", "data"]);
    await queryInterface.addIndex("daily_results", ["user_id", "data"], { unique: true });
  },
};
