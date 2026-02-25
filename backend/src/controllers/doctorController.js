const DoctorProfile = require('../models/Doctor') 
const Specialty = require('../models/Speciatly');

//Create doctor profile

exports.createDoctorProfile = async (req, res) => {
  try {
    const { userId, specialtyId, experienceYears, description, price,qualifications, rating } = req.body;

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
      rating
    });

    res.status(201).json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get all doctors
exports.getAllDoctorProfiles = async (req, res) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'fullName email phone image')
      .populate('specialtyId', 'name');

    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//Get doctor by id
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

//get doctor by specialty
exports.getDoctorsBySpecialty = async (req, res) => {
  try {
    const specialty = await Specialty.findOne({ name: req.params.name });
    if (!specialty) {
      return res.status(404).json({ message: 'Specialty not found' });
    }
    const doctors = await DoctorProfile.find({ specialtyId: specialty._id })
      .populate('userId', 'fullName email phone image')
      .populate('specialtyId', 'name');
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update doctor profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const {
      specialtyId,        // thực tế là specialty name
      experienceYears,
      qualifications,
      description,
      price
    } = req.body;

    let updateData = {
      experienceYears,
      qualifications,
      description,
      price
    };

    // Nếu có gửi specialty name lên
    if (specialtyId) {
      const specialty = await Specialty.findOne({ name: specialtyId });

      if (!specialty) {
        return res.status(400).json({ message: "Specialty not found" });
      }

      updateData.specialtyId = specialty._id;
    }

    const updated = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("specialtyId"); // nếu muốn trả luôn thông tin specialty

    if (!updated) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.json(updated);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


//Toggle active status
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
