const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

const {
  createSpecialty,
  getAllSpecialties,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty
} = require('../controllers/specialyController');

// Public
router.get('/', getAllSpecialties);
router.get('/:id', getSpecialtyById);

// Admin only
router.post('/', auth, admin, createSpecialty);
router.patch('/:id', auth, admin, updateSpecialty);
router.delete('/:id', auth, admin, deleteSpecialty);

module.exports = router;
