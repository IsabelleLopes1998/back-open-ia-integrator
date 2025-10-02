class Image {
  constructor(data) {
    this.created = data.created || null;
    this.prompt = data.prompt || '';
    this.model = data.model || 'dall-e-3';
    this.size = data.size || '1024x1024';
    this.quality = data.quality || 'standard';
    this.style = data.style || 'vivid';
    this.base64 = data.base64 || null;
    this.url = data.url || null;
    this.filename = data.filename || null;
    this.imageUrl = data.imageUrl || null;
    this.filePath = data.filePath || null;
    this.usage = data.usage || null;
    this.createdAt = data.createdAt || new Date();
    this.success = data.success || false;
    this.error = data.error || null;
  }

  // Método para criar uma imagem a partir da resposta da OpenAI
  static fromOpenAIResponse(openAIResponse, prompt, options = {}) {
    const imageData = openAIResponse.data && openAIResponse.data[0];
    
    if (!imageData) {
      throw new Error('Resposta inválida da OpenAI');
    }

    return new Image({
      created: openAIResponse.created || null,
      prompt: prompt,
      model: options.model || 'dall-e-3',
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      base64: imageData.b64_json || null,
      url: imageData.url || null,
      usage: openAIResponse.usage || null,
      success: true,
      createdAt: new Date()
    });
  }

  // Método para criar uma imagem salva em arquivo
  static fromSavedFile(openAIResponse, prompt, filename, filePath, options = {}) {
    const image = Image.fromOpenAIResponse(openAIResponse, prompt, options);
    image.filename = filename;
    image.filePath = filePath;
    image.imageUrl = `/uploads/${filename}`;
    return image;
  }

  // Método para serializar para JSON
  toJSON() {
    return {
      created: this.created,
      prompt: this.prompt,
      model: this.model,
      size: this.size,
      quality: this.quality,
      style: this.style,
      base64: this.base64,
      url: this.url,
      filename: this.filename,
      imageUrl: this.imageUrl,
      filePath: this.filePath,
      usage: this.usage,
      createdAt: this.createdAt,
      success: this.success,
      error: this.error
    };
  }

  // Método para resposta da API (sem dados sensíveis)
  toAPIResponse() {
    const response = {
      success: this.success,
      message: this.success ? 'Imagem gerada com sucesso' : 'Erro ao gerar imagem',
      data: {
        created: this.created,
        prompt: this.prompt,
        model: this.model,
        size: this.size,
        quality: this.quality,
        style: this.style,
        usage: this.usage,
        createdAt: this.createdAt
      }
    };

    if (this.success) {
      if (this.base64) {
        response.data.base64 = this.base64;
      }
      if (this.url) {
        response.data.url = this.url;
      }
      if (this.filename) {
        response.data.filename = this.filename;
      }
      if (this.imageUrl) {
        response.data.imageUrl = this.imageUrl;
      }
    } else {
      response.error = this.error;
    }

    return response;
  }

  // Método para criar erro
  static createError(prompt, error, options = {}) {
    return new Image({
      prompt: prompt,
      model: options.model || 'dall-e-3',
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      style: options.style || 'vivid',
      success: false,
      error: error,
      createdAt: new Date()
    });
  }
}

module.exports = Image;
