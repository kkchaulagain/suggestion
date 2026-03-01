const express = require('express');
const { getBusiness,findBusinessById,deleteBusiness } = require('../../controllers/v1/businessController');

const router = express.Router();

router.get('/', getBusiness);
router.get('/:id', findBusinessById);
router.delete('/:id', deleteBusiness);


module.exports = router;
