const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

// 🔹 Model de fechamentos diários do diário (mini índice — WIN)
const DailyResult = sequelize.define("DailyResult", {

  data: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  pontos: {
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
  tableName: "daily_results",
  timestamps: true
});

module.exports = DailyResult;
