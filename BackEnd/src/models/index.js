const sequelize = require("../config/db");

const User = require("./User");
const Trade = require("./Trade");

// Trade pertence a um User (dono da operação)
Trade.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(Trade,   { foreignKey: "user_id", as: "trades" });

module.exports = { sequelize, User, Trade };
