const { Sequelize } = require("sequelize");

const dbDialect = process.env.DB_DIALECT || "postgres";
const dbSslEnabled = String(process.env.DB_SSL || "false").toLowerCase() === "true";
const dbSslRejectUnauthorized = String(process.env.DB_SSL_REJECT_UNAUTHORIZED || "false").toLowerCase() === "true";

const pool = { max: 10, min: 0, acquire: 30000, idle: 10000 };

// 🔹 Em produção na Railway, DATABASE_URL é injetada automaticamente pelo plugin Postgres
let sequelize;
if (process.env.DATABASE_URL) {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false,
    pool,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
  });
} else {
  const sequelizeOptions = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: dbDialect,
    logging: false,
    pool,
  };

  if (dbSslEnabled) {
    sequelizeOptions.dialectOptions = {
      ssl: {
        require: true,
        rejectUnauthorized: dbSslRejectUnauthorized,
      },
    };
  }

  sequelize = new Sequelize(
    process.env.DB_NAME || "diario_operacoes",
    process.env.DB_USER || "postgres",
    process.env.DB_PASS || "postgres",
    sequelizeOptions
  );
}

module.exports = sequelize;
