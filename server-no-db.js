const app = require('./app.js');

// Inicia o servidor sem banco de dados para testar apenas a API de imagens
app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000 (sem banco de dados)');
  console.log('APIs disponíveis:');
  console.log('- POST /api/image/generate-base64');
  console.log('- POST /api/image/generate');
  console.log('- POST /api/image/generate-file');
  console.log('- GET /health');
});
