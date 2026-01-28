const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { validateToken, validateEmergency, validateId } = require('../middleware/validation');

// Create a new token (with validation)
router.post('/', validateToken, tokenController.createToken);

// Add emergency token (with validation)
router.post('/emergency', validateEmergency, tokenController.addEmergencyToken);

// Cancel a token (with validation)
router.put('/:tokenId/cancel', validateId, tokenController.cancelToken);

// Mark as no-show (with validation)
router.put('/:tokenId/no-show', validateId, tokenController.markNoShow);

// Get tokens by doctor (with validation)
router.get('/doctor/:doctorId', validateId, tokenController.getTokensByDoctor);

// Reallocate tokens for a doctor (with validation)
router.post('/reallocate/:doctorId', validateId, tokenController.reallocateTokens);

module.exports = router;