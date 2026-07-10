const router = require("express").Router();
const controller = require("../controllers/userController");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimiter");
const auth = require("../controllers/middleware/auth");

router.post("/register", registerLimiter, controller.register);
router.post("/login", loginLimiter, controller.login);

router.get("/me", auth, controller.getMe);
router.put("/me", auth, controller.updateMe);

module.exports = router;
