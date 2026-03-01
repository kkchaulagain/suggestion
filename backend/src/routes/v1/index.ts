const express = require('express');
const businessRoutes = require('./business');

const router = express.Router();

router.use('/business', businessRoutes);

module.exports = router;
