const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const { globalLimiter } = require("./middleware/rateLimiter");
const { sequelize } = require("./models");

const app = express();
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "1mb";
const apiBasePath = process.env.API_BASE_PATH || "/api/v1";

// Atrás do proxy da Railway (produção), confia no primeiro hop para que req.ip reflita o IP
// real do cliente via X-Forwarded-For — sem isso o rate limiter via todos os usuários como um
// único IP (o do proxy), fazendo tráfego abusivo de uma pessoa bloquear todo mundo.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

function normalizeOrigin(origin) {
  return String(origin || "").trim().replace(/\/$/, "").toLowerCase();
}

function getAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173";
  const configured = raw.split(",").map((value) => normalizeOrigin(value)).filter(Boolean);

  // Em produção o próprio backend serve o frontend (mesma origem): o navegador ainda manda o
  // header Origin nas requisições, então o domínio público do Railway precisa estar na lista
  // mesmo sem configurar CORS_ALLOWED_ORIGINS manualmente.
  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
  const selfOrigin = railwayDomain ? normalizeOrigin(`https://${railwayDomain}`) : null;

  return [...new Set([...configured, selfOrigin].filter(Boolean))];
}

const allowedOrigins = getAllowedOrigins();

// 🔒 CORS Seguro - apenas frontend autorizado
const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const normalizedRequestOrigin = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalizedRequestOrigin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked for origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

// 🔒 Middlewares de Segurança
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json({ limit: requestBodyLimit }));

const userRoutes = require("./routes/userRoutes");
const dailyResultRoutes = require("./routes/dailyResultRoutes");

app.get(`${apiBasePath}/`, (req, res) => {
  res.send("API Diário de Operações rodando 🚀");
});

app.get(`${apiBasePath}/health/db`, async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    return res.status(503).json({ status: "error", database: "disconnected", message: error.message });
  }
});

app.use(`${apiBasePath}/users`, userRoutes);
app.use(`${apiBasePath}/daily-results`, dailyResultRoutes);

// 🔹 Em produção, o próprio backend serve o build estático do frontend
// (mesma origem — evita precisar de CORS ou de um serviço separado)
if (process.env.NODE_ENV === "production") {
  const frontendDist = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// 🔹 Handler de erros: garante resposta JSON em vez de derrubar o processo
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ message: "Erro interno do servidor" });
});

module.exports = app;
