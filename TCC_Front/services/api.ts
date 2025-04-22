import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  timeout: 10000,
});

// Exemplo de chamada de login
export const login = async (email: string, senha: string) => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { error: 'Erro ao fazer login' };
  }
};

// Chamada para obter os pets
export const getPets = async () => {
  const response = await api.get('/pets');
  return response.data;
};

// Chamada para obter os estados
// Chamada para obter os estados, retornando apenas os nomes
export const getEstados = async () => {
  try {
    const response = await api.get('/estados');
    // Assumindo que a resposta tem um array de objetos com o campo 'nome'
    return response.data.map((estado: { nome: string }) => estado.nome);
  } catch (error) {
    console.error('Erro ao carregar os estados', error);
    return [];
  }
};

// Chamada para obter as cidades por estado, retornando apenas os nomes
export const getCidadesPorEstado = async (estadoId: number) => {
  try {
    const response = await api.get(`/cidades?estadoId=${estadoId}`);
    // Assumindo que a resposta tem um array de objetos com o campo 'nome'
    return response.data.map((cidade: { nome: string }) => cidade.nome);
  } catch (error) {
    console.error('Erro ao carregar as cidades', error);
    return [];
  }
};

// Chamada para obter os usuários
export const getUsuarios = async () => {
  const response = await api.get('/usuarios');
  return response.data;
};

// Chamada para obter faixa etária
export const getFaixaEtaria = async () => {
  const response = await api.get('/faixa-etaria');
  return response.data;
};

// Chamada para obter status
export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};

// Chamada para obter doenças e deficiências
export const getDoencasDeficiencias = async () => {
  const response = await api.get('/doencasdeficiencias');
  return response.data;
};

// Chamada para obter espécies
export const getEspecies = async () => {
  const response = await api.get('/especies');
  return response.data;
};

// Chamada para obter raças
export const getRacas = async () => {
  const response = await api.get('/racas');
  return response.data;
};

// Chamada para obter favoritos
export const getFavoritos = async () => {
  const response = await api.get('/favoritos');
  return response.data;
};

// Chamada para obter sexo do usuário
export const getSexoUsuario = async () => {
  const response = await api.get('/sexoUsuario');
  return response.data;
};
