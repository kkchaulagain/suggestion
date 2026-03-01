const express = require('express');
const { getBusiness } = require('../../controllers/v1/businessController');

const router = express.Router();

router.get('/', getBusiness);

module.exports = router;
