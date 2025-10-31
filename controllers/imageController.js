const imageService = require('../services/imageService');
const path = require('path');
const Image = require('../models/image');

// Endpoints legados (base64/arquivo) removidos; usamos apenas URL

async function generateImageWithUrl(req, res) {
  try {
    const { prompt, model, size, quality, style, store } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        error: "Prompt é obrigatório" 
      });
    }

    console.log('🔄 Gerando imagem com URL para prompt:', prompt);

    // Timeout: 30 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: OpenAI API demorou muito para responder')), 30000);
    });

    const options = {
      model: model || "dall-e-3",
      size: size || "1024x1024",
      quality: quality || "standard",
      style: style || "vivid"
    };

    const imagePromise = imageService.generateImageWithUrl(prompt, options);
    
    const image = await Promise.race([imagePromise, timeoutPromise]);

    if (image.success) {
      console.log('✅ Imagem gerada com URL com sucesso');

      // Caso solicitado, armazena temporariamente no Supabase e retorna URL assinada
      if (store) {
        try {
          const apiRes = image.toAPIResponse();
          const originalUrl = apiRes?.data?.url || apiRes?.url;
          const stored = await imageService.storeOpenAIUrlToSupabase({ imageUrl: originalUrl, prompt });
          if (stored.success) {
            return res.status(200).json({
              ...apiRes,
              stored: {
                provider: 'supabase',
                url: stored.url,
                path: stored.path,
                contentType: stored.contentType,
                size: stored.size,
                expiresInSeconds: 3600
              }
            });
          } else {
            console.warn('⚠️ Falha ao salvar no Supabase:', stored.error);
            return res.status(200).json(apiRes);
          }
        } catch (storeErr) {
          console.warn('⚠️ Erro ao processar armazenamento no Supabase:', storeErr.message);
          return res.status(200).json(image.toAPIResponse());
        }
      }

      return res.status(200).json(image.toAPIResponse());
    } else {
      console.log('❌ Erro ao gerar imagem com URL:', image.error);
      return res.status(500).json(image.toAPIResponse());
    }
  } catch (error) {
    console.error('💥 Erro no controller de imagem com URL:', error);
    const errorImage = Image.createError(req.body.prompt || '', error.message);
    return res.status(500).json(errorImage.toAPIResponse());
  }
}

async function downloadImageProxy(req, res) {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ 
        error: "URL da imagem é obrigatória" 
      });
    }

    console.log('🔄 Fazendo proxy de download para:', imageUrl);

    const result = await imageService.downloadImageFromUrl(imageUrl);
    
    if (result.success) {
      // Define headers para download
      res.setHeader('Content-Type', result.contentType);
      res.setHeader('Content-Length', result.size);
      res.setHeader('Content-Disposition', 'attachment; filename="imagem-download.png"');
      
      console.log('✅ Enviando imagem via proxy:', result.size, 'bytes');
      return res.send(result.buffer);
    } else {
      console.error('❌ Erro no proxy:', result.error);
      return res.status(500).json({ 
        error: `Erro ao baixar imagem: ${result.error}` 
      });
    }
  } catch (error) {
    console.error('💥 Erro no controller de proxy:', error);
    return res.status(500).json({ 
      error: `Erro interno: ${error.message}` 
    });
  }
}

module.exports = {
  generateImageWithUrl,
  downloadImageProxy
};
