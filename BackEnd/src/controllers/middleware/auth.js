const jwt = require("jsonwebtoken");

// Middleware de autenticação JWT
// Lê o token do cookie httpOnly (definido no login/registro) e, como alternativa, do header
// Authorization: Bearer — útil para chamadas de API diretas (ex: scripts, testes).
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
  const token = req.cookies?.token || bearerToken;

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error("JWT_SECRET não configurado");
    return res.status(500).json({ message: "Erro no servidor" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado" });
    }
    return res.status(401).json({ message: "Token inválido" });
  }
};
