import axios from 'axios';

const api = axios.create({
  baseURL: 'http://10.0.2.2:3000/api',
  timeout: 10000,
});

// Adicionando interceptor de erro para todas as requisições
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data || { error: 'Erro na requisição' };
    console.error('Erro:', errorMessage);
    return Promise.reject(errorMessage);
  }
);

// Exemplo de chamada de login
export const login = async (email: string, senha: string) => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  } catch (error: any) {
    throw error || { error: 'Erro ao fazer login' };
  }
};

// Chamada para obter os pets
export const getPets = async () => {
  const response = await api.get('/pets');
  return response.data;
};

// Chamada para obter os estados
export const getEstados = async () => {
  try {
    const response = await api.get('/estados');
    return response.data.map((estado: { nome: string }) => estado.nome);
  } catch (error) {
    console.error('Erro ao carregar os estados', error);
    return [];
  }
};

// Chamada para obter as cidades por estado
// Chamada para obter as cidades por estado
type Cidade = {
  nome: string;
};

export const getCidadesPorEstado = async (estadoNome: string): Promise<Cidade[]> => {
  try {
    const estadosResponse = await api.get('/estados');
    const estado = estadosResponse.data.find((e: { nome: string; id: string }) => e.nome === estadoNome);

    if (!estado) {
      console.error('Estado não encontrado:', estadoNome);
      return [];
    }

    const estadoId = estado.id;

    const response = await api.get(`/cidades?estadoId=${estadoId}`);
    return response.data.map((cidade: { nome: string }) => ({ nome: cidade.nome }));
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
  try {
    console.log('Fazendo requisição para /sexoUsuario');
    const response = await api.get('/sexoUsuario');
    console.log('Resposta recebida:', response.data);
    return response.data.map((sexo: { descricao: string }) => sexo.descricao);
  } catch (error: any) {
    console.error('Erro completo:', error);
    return [];
  }
};
