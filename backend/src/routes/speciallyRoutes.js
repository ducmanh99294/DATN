const express = require('express');
const router = express.Router();

const auth = require('../middlewares/authMiddleware');
const admin = require('../middlewares/adminMiddleware');

const {
  createSpecialty,
  getAllSpecialties,
  getSpecialtyById,
  updateSpecialty,
  deleteSpecialty,
  getSpecialtyBySlug,
  suggestSpecialty
} = require('../controllers/specialyController');

// Public
router.get('/', getAllSpecialties);
router.get('/:id', getSpecialtyById);
router.get('/slug/:slug', getSpecialtyBySlug);
router.post('/suggest', suggestSpecialty);

// Admin only
router.post('/', auth, admin, createSpecialty);
router.put('/:id', auth, admin, updateSpecialty);
router.delete('/:id', auth, admin, deleteSpecialty);

module.exports = router;
