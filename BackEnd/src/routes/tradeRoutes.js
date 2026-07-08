const router = require("express").Router();
const controller = require("../controllers/tradeController");
const auth = require("../controllers/middleware/auth");

router.use(auth);

router.get("/", controller.getTrades);
router.post("/", controller.createTrade);
router.post("/seed", controller.seedTrades);
router.delete("/", controller.clearTrades);
router.put("/:id", controller.updateTrade);
router.delete("/:id", controller.deleteTrade);

module.exports = router;
