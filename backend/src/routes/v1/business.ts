const express = require('express');
const { getBusiness,findBusinessById,deleteBusiness,updateBusiness } = require('../../controllers/v1/businessController');

const router = express.Router();

router.get('/', getBusiness);
router.get('/:id', findBusinessById);
router.delete('/:id', deleteBusiness);
router.put('/:id',updateBusiness );


module.exports = router;
