const sequelize = require("../config/db");

const User = require("./User");
const DailyResult = require("./DailyResult");

// DailyResult pertence a um User (dono do fechamento)
DailyResult.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(DailyResult, { foreignKey: "user_id", as: "dailyResults" });

module.exports = { sequelize, User, DailyResult };
