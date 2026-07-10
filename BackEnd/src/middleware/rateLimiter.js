const rateLimit = require("express-rate-limit");

const isDevelopment = process.env.NODE_ENV !== "production";
const globalWindowMs = Number(process.env.GLOBAL_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const globalMax = Number(process.env.GLOBAL_RATE_LIMIT_MAX || (isDevelopment ? 5000 : 1000));

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: globalWindowMs,
  max: globalMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return res.status(429).json({
      message: "Muitas requisições, tente novamente mais tarde",
      error: "RATE_LIMIT_EXCEEDED",
    });
  },
  skip: (req) => req.path === "/" || req.path === "/health/db",
});

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: "Muitas tentativas de login"
});

// Rate limiting para criação de contas — evita cadastro automatizado em massa
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Muitas tentativas de cadastro, tente novamente mais tarde"
});

module.exports = { globalLimiter, loginLimiter, registerLimiter };
