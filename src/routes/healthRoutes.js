const express = require('express');
const healthControllers= require('../controllers/healthController')
const router = express.Router();
router.get('/', healthControllers.healthCheck)
module.exports = router;