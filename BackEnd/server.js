require("dotenv").config();

const app = require("./src/app");
const { sequelize } = require("./src/models");

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost");

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Banco de dados conectado com sucesso.");

    app.listen(PORT, HOST, () => {
      console.log(`Servidor rodando em http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Falha ao conectar no banco de dados:", error.message);
    process.exit(1);
  }
}

startServer();
