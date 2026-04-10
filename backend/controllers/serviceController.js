const db = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// GET /api/services - all active services
exports.getAllServices = async (req, res) => {
  try {
    const { category, search, provider_id } = req.query;

    let query = `
      SELECT s.*, u.name as provider_name, u.email as provider_email,
             COALESCE(AVG(r.rating), 0) as avg_rating,
             COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.is_active = TRUE
    `;
    const params = [];

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (s.name LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (provider_id) {
      query += ' AND s.provider_id = ?';
      params.push(provider_id);
    }

    query += ' GROUP BY s.id ORDER BY s.created_at DESC';

    const [services] = await db.query(query, params);
    res.json({ services });
  } catch (err) {
    console.error('Get services error:', err);
    res.status(500).json({ message: 'Failed to fetch services.' });
  }
};

// GET /api/services/:id
exports.getServiceById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, u.name as provider_name, u.email as provider_email,
             COALESCE(AVG(r.rating), 0) as avg_rating, COUNT(r.id) as review_count
      FROM services s
      JOIN users u ON s.provider_id = u.id
      LEFT JOIN reviews r ON s.id = r.service_id
      WHERE s.id = ? AND s.is_active = TRUE
      GROUP BY s.id
    `, [req.params.id]);

    if (rows.length === 0) return res.status(404).json({ message: 'Service not found.' });

    const [reviews] = await db.query(`
      SELECT r.*, u.name as customer_name FROM reviews r
      JOIN users u ON r.customer_id = u.id
      WHERE r.service_id = ? ORDER BY r.created_at DESC LIMIT 10
    `, [req.params.id]);

    res.json({ service: rows[0], reviews });
  } catch (err) {
    console.error('Get service error:', err);
    res.status(500).json({ message: 'Failed to fetch service.' });
  }
};

// POST /api/services - provider adds a service
exports.addService = async (req, res) => {
  try {
    const { name, description, price, category, duration_minutes } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required.' });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'smart_booking/services',
      });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path); // cleanup temp file
    }

    const [result] = await db.query(
      'INSERT INTO services (provider_id, name, description, price, category, image, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, name, description || null, price, category || 'General', imageUrl, duration_minutes || 60]
    );

    res.status(201).json({ message: 'Service added successfully!', serviceId: result.insertId });
  } catch (err) {
    console.error('Add service error:', err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Failed to add service.' });
  }
};

// PUT /api/services/:id
exports.updateService = async (req, res) => {
  try {
    const { name, description, price, category, duration_minutes, is_active } = req.body;
    const serviceId = req.params.id;

    const [existing] = await db.query('SELECT * FROM services WHERE id = ? AND provider_id = ?', [serviceId, req.user.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Service not found or not authorized.' });
    }

    let imageUrl = existing[0].image;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'smart_booking/services' });
      imageUrl = result.secure_url;
      fs.unlinkSync(req.file.path);
    }

    await db.query(
      'UPDATE services SET name=?, description=?, price=?, category=?, image=?, duration_minutes=?, is_active=? WHERE id=?',
      [name || existing[0].name, description || existing[0].description, price || existing[0].price,
       category || existing[0].category, imageUrl, duration_minutes || existing[0].duration_minutes,
       is_active !== undefined ? is_active : existing[0].is_active, serviceId]
    );

    res.json({ message: 'Service updated successfully!' });
  } catch (err) {
    console.error('Update service error:', err);
    res.status(500).json({ message: 'Failed to update service.' });
  }
};

// DELETE /api/services/:id
exports.deleteService = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM services WHERE id = ? AND provider_id = ?', [req.params.id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ message: 'Service not found or not authorized.' });

    await db.query('UPDATE services SET is_active = FALSE WHERE id = ?', [req.params.id]);
    res.json({ message: 'Service deleted successfully.' });
  } catch (err) {
    console.error('Delete service error:', err);
    res.status(500).json({ message: 'Failed to delete service.' });
  }
};
