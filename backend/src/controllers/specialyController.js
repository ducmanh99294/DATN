const Specialty = require('../models/Speciatly');

/**
 * @desc    Create specialty
 * @route   POST /api/specialties
 * @access  Admin
 */
exports.createSpecialty = async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const specialties = await Specialty.insertMany(req.body, { ordered: false });
      return res.status(201).json({
        message: `Đã thêm thành công ${specialties.length} chuyên khoa.`,
        data: specialties
      });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tên không được để trống (name is missing)' });
    }

    const existed = await Specialty.findOne({ name });
    if (existed) {
      return res.status(400).json({ message: 'Specialty already exists' });
    }

    const specialty = await Specialty.create({ name, description });
    res.status(201).json(specialty);

  } catch (error) {
    // Xử lý lỗi trùng lặp khi insert nhiều
    if (error.code === 11000) {
       return res.status(400).json({ 
         message: 'Có dữ liệu bị trùng tên (Duplicate key error)',
         details: error.writeErrors || error.message 
       });
    }
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get all specialties
 * @route   GET /api/specialties
 * @access  Public
 */
exports.getAllSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find().sort({ name: 1 });
    res.json(specialties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Get specialty by id
 * @route   GET /api/specialties/:id
 * @access  Public
 */
exports.getSpecialtyById = async (req, res) => {
  try {
    const specialty = await Specialty.findById(req.params.id);

    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    res.json(specialty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Update specialty
 * @route   PATCH /api/specialties/:id
 * @access  Admin
 */
exports.updateSpecialty = async (req, res) => {
  try {
    const updated = await Specialty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc    Delete specialty
 * @route   DELETE /api/specialties/:id
 * @access  Admin
 */
exports.deleteSpecialty = async (req, res) => {
  try {
    const deleted = await Specialty.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Specialty not found' });
    }

    res.json({ message: 'Specialty removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};