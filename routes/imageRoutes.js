const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');

// Rota principal para geração de imagens (com opção de salvar ou não)
router.post('/generate', imageController.generateImage);

// Rota específica para gerar e salvar imagem em arquivo
router.post('/generate-file', imageController.generateImageWithFile);

// Rota específica para gerar imagem e retornar base64
router.post('/generate-base64', imageController.generateImageBase64);

// Rota específica para gerar imagem e retornar URL
router.post('/generate-url', imageController.generateImageWithUrl);

// Rota para proxy de download (contorna CORS)
router.post('/download-proxy', imageController.downloadImageProxy);

module.exports = router;
