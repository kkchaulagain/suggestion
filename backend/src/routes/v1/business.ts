const express = require('express');
const { getBusiness,findBusinessById } = require('../../controllers/v1/businessController');

const router = express.Router();

router.get('/', getBusiness);
router.get('/:id', findBusinessById);

module.exports = router;
