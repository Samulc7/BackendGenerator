
const express = require("express");
const router = express.Router();
const controller = require("../controllers/usoia");

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", controller.criar);
router.patch("/:id", controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
