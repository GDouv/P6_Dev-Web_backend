const express = require("express");
const router = express.Router();

const password = require("../middleware/password");

const emailValidator = require("../middleware/emailValidator");

const userCtrl = require("../controllers/user");

router.post("/signup", emailValidator, password, userCtrl.signup);
router.post("/login", userCtrl.login);

module.exports = router;
