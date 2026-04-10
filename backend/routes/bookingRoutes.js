const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  createBooking, getBookings, updateBookingStatus, addReview
} = require('../controllers/bookingController');

router.post('/', authenticate, authorizeRoles('customer'), createBooking);
router.get('/', authenticate, getBookings);
router.patch('/:id/status', authenticate, updateBookingStatus);
router.post('/:id/review', authenticate, authorizeRoles('customer'), addReview);

module.exports = router;
