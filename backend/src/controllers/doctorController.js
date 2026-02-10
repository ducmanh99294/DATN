const DoctorProfile = require('../models/Doctor') 

/**
 * Create doctor profile
 * (Admin hoặc Doctor tự tạo lần đầu)
 */
exports.createDoctorProfile = async (req, res) => {
  try {
    const { userId, specialtyId, experienceYears, description, price,qualifications, rating, image } = req.body;

    const existed = await DoctorProfile.findOne({ userId });
    if (existed) {
      return res.status(400).json({ message: 'Doctor profile already exists' });
    }

    const profile = await DoctorProfile.create({
      userId,
      specialtyId,
      experienceYears,
      description, 
      price,
      qualifications, 
      rating, 
      image 
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all doctors
 */
exports.getAllDoctorProfiles = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'fullName email phone')
      .populate('specialtyId', 'name');

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get doctor by id
 */
exports.getDoctorProfileByUserId = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.params.userId })
      .populate('userId', 'fullName email phone image')
      .populate('specialtyId', 'name');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update doctor profile
 */
exports.updateDoctorProfile = async (req, res) => {
  try {
    const updated = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Toggle active status
 */
exports.toggleDoctorStatus = async (req, res) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.isActive = !doctor.isActive;
    await doctor.save();

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
