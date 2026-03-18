const express = require('express');
const {
  getBusiness,
  findBusinessById,
  deleteBusiness,
  updateBusiness,
  createBusiness,
  getPublicBusinessMapPins,
  getBusinessDetail,
  patchBusinessDetail,
} = require('../../controllers/v1/businessController');
const { isAuthenticated } = require('../../middleware/isauthenticated');
const { authorize } = require('../../middleware/authorize');

const router = express.Router();

router.get('/', isAuthenticated, authorize('admin'), getBusiness);
router.post('/', isAuthenticated, authorize('admin'), createBusiness);
router.get('/map-pins', isAuthenticated, authorize('admin'), getPublicBusinessMapPins);
router.get('/:id/detail', isAuthenticated, authorize('admin'), getBusinessDetail);
router.patch('/:id/detail', isAuthenticated, authorize('admin'), patchBusinessDetail);
router.get('/:id', isAuthenticated, authorize('admin'), findBusinessById);
router.delete('/:id', isAuthenticated, authorize('admin'), deleteBusiness);
router.put('/:id', isAuthenticated, authorize('admin'), updateBusiness);

module.exports = router;
