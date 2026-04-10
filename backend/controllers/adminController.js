const db = require('../config/db');

// GET /api/admin/users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, role, phone, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

// PATCH /api/admin/users/:id/toggle
exports.toggleUserStatus = async (req, res) => {
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found.' });

    const newStatus = !users[0].is_active;
    await db.query('UPDATE users SET is_active = ? WHERE id = ?', [newStatus, req.params.id]);

    res.json({ message: `User ${newStatus ? 'activated' : 'deactivated'} successfully.` });
  } catch (err) {
    console.error('Toggle user error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/bookings
exports.getAllBookings = async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.*,
             s.name as service_name, s.category,
             cu.name as customer_name, cu.email as customer_email,
             pu.name as provider_name, pu.email as provider_email
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users cu ON b.customer_id = cu.id
      JOIN users pu ON b.provider_id = pu.id
      ORDER BY b.created_at DESC
    `);
    res.json({ bookings });
  } catch (err) {
    console.error('Get all bookings error:', err);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users WHERE role != "admin"');
    const [[{ totalBookings }]] = await db.query('SELECT COUNT(*) as totalBookings FROM bookings');
    const [[{ totalRevenue }]] = await db.query('SELECT COALESCE(SUM(total_price), 0) as totalRevenue FROM bookings WHERE status = "completed"');
    const [[{ totalServices }]] = await db.query('SELECT COUNT(*) as totalServices FROM services WHERE is_active = TRUE');
    const [[{ pendingBookings }]] = await db.query('SELECT COUNT(*) as pendingBookings FROM bookings WHERE status = "pending"');

    // Bookings per day last 7 days
    const [bookingsPerDay] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM bookings
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Bookings by status
    const [bookingsByStatus] = await db.query(`
      SELECT status, COUNT(*) as count FROM bookings GROUP BY status
    `);

    // Top services
    const [topServices] = await db.query(`
      SELECT s.name, COUNT(b.id) as booking_count, SUM(b.total_price) as revenue
      FROM services s LEFT JOIN bookings b ON s.id = b.service_id
      GROUP BY s.id ORDER BY booking_count DESC LIMIT 5
    `);

    // Users by role
    const [usersByRole] = await db.query(`
      SELECT role, COUNT(*) as count FROM users WHERE role != "admin" GROUP BY role
    `);

    res.json({
      summary: { totalUsers, totalBookings, totalRevenue, totalServices, pendingBookings },
      bookingsPerDay,
      bookingsByStatus,
      topServices,
      usersByRole,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};

// GET /api/admin/services
exports.getAllServices = async (req, res) => {
  try {
    const [services] = await db.query(`
      SELECT s.*, u.name as provider_name, u.email as provider_email,
             COUNT(b.id) as booking_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN bookings b ON s.id = b.service_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    res.json({ services });
  } catch (err) {
    console.error('Admin get services error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
