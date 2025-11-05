const { createClient } = require('@supabase/supabase-js');
const path = require('path');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucketName = process.env.SUPABASE_BUCKET || 'openai-images';

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados. Upload desabilitado.');
      this.client = null;
      return;
    }

    this.client = createClient(this.supabaseUrl, this.supabaseKey, {
      auth: { persistSession: false }
    });
  }

  isEnabled() {
    return !!this.client;
  }

  async ensureBucketExists() {
    try {
      // Buckets não são listáveis via SDK sem storage admin; tentamos criar e ignoramos erro se existir
      const { error } = await this.client.storage.createBucket(this.bucketName, {
        public: false,
        fileSizeLimit: '10MB'
      });
      if (error && !String(error.message).includes('already exists')) {
        console.warn('⚠️ Não foi possível criar bucket (pode já existir):', error.message);
      }
    } catch (err) {
      console.warn('⚠️ Falha ao garantir bucket:', err.message);
    }
  }

  async uploadBuffer({ buffer, contentType = 'image/png', objectPath }) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase não configurado' };
    }

    await this.ensureBucketExists();

    const filePath = objectPath;

    const { error } = await this.client.storage
      .from(this.bucketName)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: filePath };
  }

  async createSignedUrl({ objectPath, expiresInSeconds = 60 * 60 }) {
    if (!this.isEnabled()) {
      return { success: false, error: 'Supabase não configurado' };
    }
    // criação da URL assinada para o objeto
    const { data, error } = await this.client.storage
      .from(this.bucketName)
      .createSignedUrl(objectPath, expiresInSeconds);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, url: data.signedUrl };
  }
}

module.exports = new SupabaseService();


