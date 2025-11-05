const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Rota para gerar imagem e retornar URL (com opção de armazenar no Supabase)
router.post('/generate-url', imageController.generateImageWithUrl);

// Rota para proxy de download (contorna CORS)
router.post('/download-proxy', imageController.downloadImageProxy);

module.exports = router;
