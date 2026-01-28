const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { validateDoctor, validateId } = require('../middleware/validation');

router.post('/', validateDoctor, doctorController.createDoctor);
router.get('/', doctorController.getAllDoctors);
router.get('/:doctorId/schedule', validateId, doctorController.getDoctorSchedule);
router.put('/:doctorId/slots', validateId, doctorController.updateDoctorSlots);

module.exports = router;