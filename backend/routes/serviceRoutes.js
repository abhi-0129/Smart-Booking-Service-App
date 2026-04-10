const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getAllServices, getServiceById, addService, updateService, deleteService
} = require('../controllers/serviceController');

router.get('/', getAllServices);
router.get('/:id', getServiceById);
router.post('/', authenticate, authorizeRoles('provider'), upload.single('image'), addService);
router.put('/:id', authenticate, authorizeRoles('provider'), upload.single('image'), updateService);
router.delete('/:id', authenticate, authorizeRoles('provider'), deleteService);

module.exports = router;
