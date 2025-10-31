const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Rota específica para gerar imagem e retornar URL
router.post('/generate-url', imageController.generateImageWithUrl);

// Rota para proxy de download (contorna CORS)
router.post('/download-proxy', imageController.downloadImageProxy);

module.exports = router;
