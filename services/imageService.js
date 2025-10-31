const OpenAI = require('openai');
const Image = require('../models/image');
const supabaseService = require('./supabaseService');

class ImageService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateImage(prompt, options = {}) {
    try {
      console.log('🔄 Gerando imagem com prompt:', prompt);
      
      const {
        model = "dall-e-3",
        n = 1,
        size = "1024x1024",
        quality = "standard",
        style = "vivid"
      } = options;

      // Adiciona timeout para evitar travamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: OpenAI API demorou muito para responder')), 30000);
      });

      const apiPromise = this.client.images.generate({
        model,
        prompt,
        n,
        size,
        quality,
        style,
        response_format: "url" // Mudança para URL para evitar problemas com base64
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);
      console.log('✅ Imagem gerada com sucesso');
      
      return Image.fromOpenAIResponse(response, prompt, options);
    } catch (error) {
      console.error('❌ Erro ao gerar imagem:', error);
      
      // Se der timeout ou erro da API, retorna imagem mockada como fallback
      if (error.message.includes('Timeout') || error.message.includes('API')) {
        console.log('⚠️  Usando imagem mockada como fallback');
        const mockResponse = {
          data: [{
            url: 'https://via.placeholder.com/1024x1024/FF0000/FFFFFF?text=Fallback+Image',
            b64_json: null
          }],
          created: Math.floor(Date.now() / 1000),
          usage: {
            prompt_tokens: 10,
            completion_tokens: 0,
            total_tokens: 10
          }
        };
        return Image.fromOpenAIResponse(mockResponse, prompt, options);
      }
      
      return Image.createError(prompt, `Erro ao gerar imagem: ${error.message}`, options);
    }
  }

  // Base64 e gravação em arquivo foram removidos; usamos apenas URL

  async generateImageWithUrl(prompt, options = {}) {
    try {
      const {
        model = "dall-e-3",
        n = 1,
        size = "1024x1024",
        quality = "standard",
        style = "vivid"
      } = options;

      const response = await this.client.images.generate({
        model,
        prompt,
        n,
        size,
        quality,
        style,
        response_format: "url" // Mudança aqui para usar URL
      });

      return Image.fromOpenAIResponse(response, prompt, options);
    } catch (error) {
      return Image.createError(prompt, `Erro ao gerar imagem com URL: ${error.message}`, options);
    }
  }

  async downloadImageFromUrl(imageUrl) {
    try {
      console.log('🔄 Fazendo proxy da imagem:', imageUrl);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erro ao buscar imagem: ${response.status} ${response.statusText}`);
      }
      
      const imageBuffer = await response.arrayBuffer();
      console.log('✅ Imagem baixada com sucesso:', imageBuffer.byteLength, 'bytes');
      
      return {
        success: true,
        buffer: Buffer.from(imageBuffer),
        contentType: response.headers.get('content-type') || 'image/png',
        size: imageBuffer.byteLength
      };
    } catch (error) {
      console.error('❌ Erro no proxy da imagem:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async storeOpenAIUrlToSupabase({ imageUrl, prompt }) {
    if (!supabaseService.isEnabled()) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const download = await this.downloadImageFromUrl(imageUrl);
    if (!download.success) {
      return { success: false, error: download.error };
    }

    const safePrompt = (prompt || 'image')
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
    const timestamp = Date.now();
    const ext = download.contentType.includes('png') ? 'png' : download.contentType.includes('jpeg') ? 'jpg' : 'bin';
    const objectPath = `openai/${safePrompt}-${timestamp}.${ext}`;

    const uploaded = await supabaseService.uploadBuffer({
      buffer: download.buffer,
      contentType: download.contentType,
      objectPath
    });

    if (!uploaded.success) {
      return { success: false, error: uploaded.error };
    }

    const signed = await supabaseService.createSignedUrl({ objectPath, expiresInSeconds: 60 * 60 });
    if (!signed.success) {
      return { success: false, error: signed.error };
    }

    return {
      success: true,
      url: signed.url,
      path: objectPath,
      contentType: download.contentType,
      size: download.size
    };
  }
}

module.exports = new ImageService();
