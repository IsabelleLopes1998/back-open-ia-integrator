const userService = require('../services/userService');
const auth = require('../authentication/auth.js')

const bcrypt = require('bcrypt')

async function register(req, res) {
  const {
    nome, sobrenome, cpf, email, senha, telefone
  } = req.body
  if (!nome || !sobrenome || !cpf || !email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios em branco" })
  }
  
  // Versão simplificada para testes sem banco
  try {
    const payload = { id: 'temp', email: email, nome: nome };
    const token = auth.generateAccessToken(payload);
    return res.status(200).json({ 
      message: "Usuário criado com sucesso (versão teste)",
      token: token,
      refreshToken: "dummy-refresh-token"
    });
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

async function login(req, res) {
  const {
    nome, sobrenome, cpf, email, senha
  } = req.body
  if (!email || !senha) {
    return res.status(400).json({ error: "Campos obrigatórios em branco" })
  }
  
  // Versão simplificada para testes sem banco
  try {
    const payload = { id: 'temp', email: email, nome: email.split('@')[0] };
    const token = auth.generateAccessToken(payload);
    return res.status(200).json({ 
      token: token,
      refreshToken: "dummy-refresh-token",
      user: payload
    });
  } catch (error) {
    return res.status(400).json({ error: error.message })
  }
}

async function refresh(req, res) {
  try {
    // Por enquanto, retorna um token simples para testes
    // Em produção, aqui deveria validar o refresh token
    const payload = { id: 'temp', email: 'temp@test.com', nome: 'Temp User' };
    const token = auth.generateAccessToken(payload);
    
    return res.status(200).json({ 
      token: token,
      refreshToken: "dummy-refresh-token" 
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function me(req, res) {
  try {
    // Por enquanto, retorna dados mockados para testes
    // Em produção, extrairia o usuário do token JWT
    return res.status(200).json({ 
      id: 'temp',
      email: 'temp@test.com', 
      nome: 'Temp User' 
    });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

module.exports = { register, login, refresh, me }
