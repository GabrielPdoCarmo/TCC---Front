import axios from 'axios';
//Android
const api = axios.create({
  baseURL: 'http://192.168.110.225:3000/api', // Remova o espaço extra
  timeout: 10000,
});

// //android Studio emulator
// const api = axios.create({
//   baseURL: 'http://10.0.2.2:3000/api',
//   timeout: 10000,
// });

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
    return response.data
      .map((estado: { id: number; nome: string }) => {
        return { nome: estado.nome, id: estado.id };
      })
      .sort((a: { id: number; nome: string }, b: { id: number; nome: string }) => {
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    console.error('Erro ao carregar os estados', error);
    return [];
  }
};

// Chamada para obter as cidades por estado
// Chamada para obter as cidades por estado
type Cidade = {
  id: number;
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

    // 👇 Ajuste aqui: chamada por rota dinâmica, não mais query param
    const response = await api.get(`/cidades/${estadoId}`);
    const cidades = response.data.map((cidade: { id: number; nome: string }) => ({ id: cidade.id, nome: cidade.nome }));

    // 🔤 Ordenar por ordem alfabética
    return cidades.sort((a: Cidade, b: Cidade) => a.nome.localeCompare(b.nome));
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

    return response.data.map((sexo: { id: number; descricao: string }) => ({
      id: sexo.id,
      descricao: sexo.descricao,
    }));
  } catch (error: any) {
    console.error('Erro completo:', error);
    return [];
  }
};

export const createUsuario = async (usuarioData: {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string;
  cidade_id: number; // cidade_id é obrigatório
  cep?: string; // cep é opcional
}) => {
  try {
    const response = await api.post('/usuarios', usuarioData);
    return response.data;
  } catch (error: any) {
    throw error || { error: 'Erro ao criar usuário' };
  }
};

interface ValidationResponse {
  exists?: boolean;
  [key: string]: any;
}

interface UsuarioData {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string;
  cidade_id?: number; // cidade_id opcional porque pode ser preenchido pelo cep
  cep?: string; // cep opcional
}

export async function validarUsuario(usuarioData: UsuarioData): Promise<ValidationResponse> {
  const { senha, cep } = usuarioData;

  // Verificar se a senha foi fornecida
  if (!senha) {
    throw { error: 'Senha é obrigatória.' };
  }

  // Verificar se a senha tem pelo menos 12 caracteres
  if (senha.length < 12) {
    throw { error: 'Senha muito curta', message: 'A senha deve ter pelo menos 12 caracteres.' };
  }

  // Se o usuário NÃO informou cidade_id mas informou o cep, precisamos validar o cep
  if (!usuarioData.cidade_id && cep) {
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
      const endereco = response.data;

      if (endereco?.erro) {
        throw { error: 'CEP inválido ou não encontrado.' };
      }

      if (!endereco.uf || !endereco.localidade) {
        throw { error: 'Dados de endereço incompletos no CEP informado.' };
      }
    } catch (error) {
      throw { error: 'Erro ao validar o CEP.' };
    }
  }

  // Se nem cidade_id nem cep forem informados, aí dá erro
  if (!usuarioData.cidade_id && !cep) {
    throw { error: 'É necessário informar o Cidade ou o CEP.' };
  }

  // Validação dos outros campos obrigatórios
  if (!usuarioData.nome) {
    throw { error: 'Nome é obrigatório.' };
  }

  if (!usuarioData.sexo_id) {
    throw { error: 'Sexo é obrigatório.' };
  }

  if (!usuarioData.telefone) {
    throw { error: 'Telefone é obrigatório.' };
  }

  if (!usuarioData.email) {
    throw { error: 'Email é obrigatório.' };
  }

  if (!usuarioData.cpf) {
    throw { error: 'CPF é obrigatório.' };
  }

  // Retornar resposta de sucesso se tudo estiver válido
  return { exists: false, valid: true };
}
