const router = require("express").Router();
const controller = require("../controllers/dailyResultController");
const auth = require("../controllers/middleware/auth");

router.use(auth);

router.get("/", controller.getAll);
router.post("/", controller.create);
router.post("/seed", controller.seed);
router.delete("/", controller.clearAll);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
