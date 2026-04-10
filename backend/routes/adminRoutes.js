const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getAllUsers, toggleUserStatus, getAllBookings, getAnalytics, getAllServices
} = require('../controllers/adminController');

router.use(authenticate, authorizeRoles('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/bookings', getAllBookings);
router.get('/services', getAllServices);
router.get('/analytics', getAnalytics);

module.exports = router;
