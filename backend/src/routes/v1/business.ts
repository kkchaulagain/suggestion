const express = require('express');
const { getBusiness, findBusinessById, deleteBusiness, updateBusiness } = require('../../controllers/v1/businessController');
const { isAuthenticated } = require('../../middleware/isauthenticated');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

router.get('/', isAuthenticated, authorize('admin'), getBusiness);
router.get('/:id', isAuthenticated, authorize('admin'), findBusinessById);
router.delete('/:id', isAuthenticated, authorize('admin'), deleteBusiness);
router.put('/:id', isAuthenticated, authorize('admin'), updateBusiness);

module.exports = router;
