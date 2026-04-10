const db = require('../config/db');

// POST /api/bookings - customer creates a booking
exports.createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, booking_time, notes } = req.body;
    const customer_id = req.user.id;

    if (!service_id || !booking_date || !booking_time) {
      return res.status(400).json({ message: 'Service, date, and time are required.' });
    }

    // Get service details
    const [services] = await db.query('SELECT * FROM services WHERE id = ? AND is_active = TRUE', [service_id]);
    if (services.length === 0) return res.status(404).json({ message: 'Service not found.' });

    const service = services[0];

    // Check customer not booking own provider's service (optional guard)
    if (service.provider_id === customer_id) {
      return res.status(400).json({ message: 'You cannot book your own service.' });
    }

    const [result] = await db.query(
      `INSERT INTO bookings (customer_id, service_id, provider_id, booking_date, booking_time, notes, total_price)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, service_id, service.provider_id, booking_date, booking_time, notes || null, service.price]
    );

    // Create notification for provider
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, booking_id)
       VALUES (?, 'new_booking', 'New Booking Request', ?, ?)`,
      [service.provider_id, `You have a new booking request for "${service.name}"`, result.insertId]
    );

    // Emit socket notification if io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${service.provider_id}`).emit('notification', {
        type: 'new_booking',
        title: 'New Booking Request',
        message: `You have a new booking for "${service.name}"`,
        bookingId: result.insertId,
      });
    }

    res.status(201).json({ message: 'Booking created successfully!', bookingId: result.insertId });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ message: 'Failed to create booking.' });
  }
};

// GET /api/bookings - get bookings (role-based)
exports.getBookings = async (req, res) => {
  try {
    const { id, role } = req.user;
    let query, params;

    if (role === 'customer') {
      query = `
        SELECT b.*, s.name as service_name, s.image as service_image, s.category,
               u.name as provider_name, u.email as provider_email
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON b.provider_id = u.id
        WHERE b.customer_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [id];
    } else if (role === 'provider') {
      query = `
        SELECT b.*, s.name as service_name, s.image as service_image,
               u.name as customer_name, u.email as customer_email, u.phone as customer_phone
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON b.customer_id = u.id
        WHERE b.provider_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [id];
    } else {
      return res.status(403).json({ message: 'Use admin endpoint for all bookings.' });
    }

    const [bookings] = await db.query(query, params);
    res.json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// PATCH /api/bookings/:id/status - provider updates booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    const { id: userId, role } = req.user;

    const validStatuses = ['accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    // Get booking
    const [bookings] = await db.query(`
      SELECT b.*, s.name as service_name FROM bookings b
      JOIN services s ON b.service_id = s.id
      WHERE b.id = ?
    `, [bookingId]);

    if (bookings.length === 0) return res.status(404).json({ message: 'Booking not found.' });

    const booking = bookings[0];

    // Authorize: provider can accept/reject/complete, customer can cancel
    if (role === 'provider' && booking.provider_id !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (role === 'customer' && booking.customer_id !== userId) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (role === 'customer' && status !== 'cancelled') {
      return res.status(403).json({ message: 'Customers can only cancel bookings.' });
    }

    await db.query('UPDATE bookings SET status = ? WHERE id = ?', [status, bookingId]);

    // Notify the other party
    const notifyUserId = role === 'provider' ? booking.customer_id : booking.provider_id;
    const statusMessages = {
      accepted: `Your booking for "${booking.service_name}" has been accepted!`,
      rejected: `Your booking for "${booking.service_name}" was declined.`,
      completed: `Your booking for "${booking.service_name}" is marked as completed.`,
      cancelled: `Booking for "${booking.service_name}" has been cancelled.`,
    };

    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, booking_id) VALUES (?, ?, ?, ?, ?)`,
      [notifyUserId, `booking_${status}`, `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`, statusMessages[status], bookingId]
    );

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${notifyUserId}`).emit('notification', {
        type: `booking_${status}`,
        title: `Booking ${status}`,
        message: statusMessages[status],
        bookingId,
      });
      io.to(`user_${notifyUserId}`).emit('booking_updated', { bookingId, status });
    }

    res.json({ message: `Booking ${status} successfully.` });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
};

// POST /api/bookings/:id/review
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const bookingId = req.params.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const [bookings] = await db.query(
      'SELECT * FROM bookings WHERE id = ? AND customer_id = ? AND status = "completed"',
      [bookingId, req.user.id]
    );

    if (bookings.length === 0) {
      return res.status(400).json({ message: 'Can only review completed bookings.' });
    }

    await db.query(
      'INSERT INTO reviews (booking_id, customer_id, service_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [bookingId, req.user.id, bookings[0].service_id, rating, comment || null]
    );

    res.status(201).json({ message: 'Review submitted successfully!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'You have already reviewed this booking.' });
    }
    console.error('Add review error:', err);
    res.status(500).json({ message: 'Failed to submit review.' });
  }
};
