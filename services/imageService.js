const OpenAI = require('openai');
const { writeFile } = require('fs/promises');
const path = require('path');
const Image = require('../models/image');

class ImageService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async generateImage(prompt, options = {}) {
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
        response_format: "b64_json"
      });

      return Image.fromOpenAIResponse(response, prompt, options);
    } catch (error) {
      return Image.createError(prompt, `Erro ao gerar imagem: ${error.message}`, options);
    }
  }

  async generateAndSaveImage(prompt, filename, options = {}) {
    try {
      const image = await this.generateImage(prompt, options);
      
      if (!image.success) {
        return image;
      }

      if (image.base64) {
        const imageBuffer = Buffer.from(image.base64, "base64");
        const filePath = path.join(process.cwd(), 'uploads', filename);
        
        // Criar diretório uploads se não existir
        const fs = require('fs');
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        await writeFile(filePath, imageBuffer);
        
        return Image.fromSavedFile(
          { 
            created: image.created,
            data: [{ b64_json: image.base64 }],
            usage: image.usage
          }, 
          prompt, 
          filename, 
          filePath, 
          options
        );
      } else {
        return Image.createError(prompt, 'Resposta inválida da API OpenAI', options);
      }
    } catch (error) {
      return Image.createError(prompt, `Erro ao salvar imagem: ${error.message}`, options);
    }
  }

  async generateImageBase64(prompt, options = {}) {
    try {
      const image = await this.generateImage(prompt, options);
      return image;
    } catch (error) {
      return Image.createError(prompt, `Erro ao gerar imagem base64: ${error.message}`, options);
    }
  }
}

module.exports = new ImageService();
