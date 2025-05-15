import axios from 'axios';
//Android
const api = axios.create({
  baseURL: `http://10.10.12.232:3000/api`,
  timeout: 10000,
});
console.log('Base URL:', api.defaults.baseURL);
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Função de login modificada para retornar o ID do usuário
// Função de login compatível com a resposta do backend
// Definindo interfaces para tipagem adequada
interface Usuario {
  id: number;
  nome: string;
  email: string;
}

interface LoginResponse {
  message: string;
  token: string;
  usuario: Usuario;
}

interface ApiErrorResponse {
  message?: string;
  [key: string]: any;
}

// Estrutura de erro personalizada que lançamos
interface CustomError {
  error: string;
}

export const login = async (email: string, senha: string): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', { email, senha });
    const responseData = response.data as LoginResponse;
    console.log('Resposta do login:', responseData);

    // Verifica se temos os dados necessários
    if (!responseData || !responseData.token || !responseData.usuario) {
      throw new Error('Resposta de login inválida');
    }

    // Armazenar o token no AsyncStorage
    await AsyncStorage.setItem('@App:token', responseData.token);

    // Armazenar os dados do usuário no AsyncStorage
    await AsyncStorage.setItem('@App:user', JSON.stringify(responseData.usuario));

    // Armazenar o ID do usuário separadamente
    if (responseData.usuario.id) {
      await AsyncStorage.setItem('@App:userId', responseData.usuario.id.toString());

      // Verificação de confirmação após salvar
      const savedId = await AsyncStorage.getItem('@App:userId');
      console.log('ID do usuário confirmado salvo:', savedId);
    }

    // Retornar o objeto conforme recebido
    return responseData;
  } catch (error: unknown) {
    console.error('Erro de login:', error);

    // Verifica se é um erro com resposta do servidor
    if (
      error &&
      typeof error === 'object' &&
      'response' in error &&
      error.response &&
      typeof error.response === 'object' &&
      'data' in error.response
    ) {
      const errorResponse = error.response.data as ApiErrorResponse;
      const errorMessage = errorResponse.message || 'Erro ao fazer login';
      throw { error: errorMessage } as CustomError;
    }

    // Se for um Error padrão
    if (error instanceof Error) {
      throw { error: error.message } as CustomError;
    }

    // Erro genérico ou de rede
    throw { error: 'Erro ao fazer login. Verifique sua conexão.' } as CustomError;
  }
};
// Chamada para obter os pets
interface PetPayload {
  nome: string;
  especie_id: number;
  raca_id: number;
  idade: number;
  faixa_etaria_id: number;
  usuario_id: number;
  sexo_id: number;
  rg_Pet: string | null; // RG do pet, pode ser nulo
  motivoDoacao: string;
  status_id: number;
  doencas: string[]; // nomes das doenças
  foto?: File | null;
}

export const postPet = async (petData: PetPayload) => {
  try {
    const formData = new FormData();

    formData.append('nome', petData.nome);
    formData.append('especie_id', String(petData.especie_id));
    formData.append('raca_id', String(petData.raca_id));
    formData.append('idade', String(petData.idade));
    formData.append('faixa_etaria_id', String(petData.faixa_etaria_id));
    formData.append('usuario_id', String(petData.usuario_id));
    formData.append('sexo_id', String(petData.sexo_id));
    formData.append('rg_Pet', petData.rg_Pet || ''); // Envia string vazia se rg_Pet for nulo
    formData.append('motivoDoacao', petData.motivoDoacao);
    formData.append('status_id', String(petData.status_id));

    petData.doencas.forEach((nome, index) => {
      formData.append(`doencas[${index}]`, nome);
    });

    if (petData.foto) {
      formData.append('foto', petData.foto);
    }

    const response = await api.post('/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar o pet', error);
    return null;
  }
};
interface PetUpdatePayload {
  id: number;
  nome?: string;
  especie_id?: number;
  raca_id?: number;
  idade?: number;
  faixa_etaria_id?: number;
  sexo_id?: number;
  rg_Pet?: string | null;
  motivoDoacao?: string;
  status_id?: number;
  doencas?: string[]; // nomes das doenças ou ids
  foto?: any; // Arquivo de imagem
}
export const updatePet = async (petData: PetUpdatePayload) => {
  try {
    const { id, ...petInfo } = petData;
    const formData = new FormData();

    // Adicionar campos ao FormData apenas se existirem
    if (petInfo.nome) formData.append('nome', petInfo.nome);
    if (petInfo.especie_id) formData.append('especie_id', String(petInfo.especie_id));
    if (petInfo.raca_id) formData.append('raca_id', String(petInfo.raca_id));
    if (petInfo.idade !== undefined) formData.append('idade', String(petInfo.idade));
    if (petInfo.faixa_etaria_id) formData.append('faixa_etaria_id', String(petInfo.faixa_etaria_id));
    if (petInfo.sexo_id) formData.append('sexo_id', String(petInfo.sexo_id));
    if (petInfo.rg_Pet !== undefined) formData.append('rg_Pet', petInfo.rg_Pet || '');
    if (petInfo.motivoDoacao) formData.append('motivoDoacao', petInfo.motivoDoacao);
    if (petInfo.status_id) formData.append('status_id', String(petInfo.status_id));


    // Adicionar doenças se existirem
    if (petInfo.doencas && Array.isArray(petInfo.doencas)) {
      petInfo.doencas.forEach((doenca, index) => {
        formData.append(`doencas[${index}]`, doenca);
      });
    }

    // Adicionar foto se existir
    if (petInfo.foto) {
      formData.append('foto', petInfo.foto);
    }

    const response = await api.put(`/pets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar o pet', error);
    throw error;
  }
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

export const getPetsByStatus = async () => {
  try {
    const status_id = 2; // Status fixo, apenas status 2 é permitido
    const response = await api.get('/pets/status/:status_id', {
      params: { status_id },
    });

    return response.data
      .map((pet: any) => {
        return { ...pet }; // Retorna todos os dados do pet
      })
      .sort((a: any, b: any) => {
        // Assumindo que os pets têm uma propriedade 'nome' para ordenação
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    console.error('Erro ao carregar os pets por status:', error);
    return [];
  }
};

export const updateStatus = async (id: number) => {
  try {
    const response = await api.put(`/pets/status/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar o status do pet', error);
    throw error;
  }
};

export const deletePet = async (id: number) => {
  try {
    const response = await api.delete(`/pets/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao deletar o pet', error);
    throw error;
  }
};

// Função para obter todas as doenças/deficiências ordenadas alfabeticamente
export const getDoencaPorId = async (id: number) => {
  try {
    const response = await api.get(`/doencasdeficiencias/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao carregar a doença/deficiência com ID ${id}`, error);
    return null;
  }
};

export const getDoencasPorPetId = async (petId: number) => {
  try {
    const response = await api.get(`/pets-doencas/pets/${petId}`);
    console.log('Resposta da API:', response.data); // Para debug

    return response.data.map((item: any) => {
      return {
        pet_id: petId,
        doencaDeficiencia_id: item.doencaDeficiencia_id, // Ajustado para o nome correto da propriedade
        possui: item.possui,
      };
    });
  } catch (error) {
    console.error('Erro ao carregar doenças/deficiências do pet', error);
    return [];
  }
};

export const getCidades_Estado = async (id: number, estado_id: number) => {
  try {
    // Faz a requisição para obter as cidades de um estado com base no id e estado_id
    const response = await api.get(`/cidades/${id}/${estado_id}`);

    // Verifica se a resposta tem os dados esperados
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Resposta da API de cidades em formato inválido');
      return [];
    }

    // Retorna a lista de cidades ordenada pelo nome
    return response.data
      .map((cidade: { id: number; nome: string }) => {
        return { nome: cidade.nome, id: cidade.id };
      })
      .sort((a: { id: number; nome: string }, b: { id: number; nome: string }) => {
        return a.nome.localeCompare(b.nome); // Ordenação alfabética pela propriedade 'nome'
      });
  } catch (error) {
    // Caso ocorra algum erro durante a requisição, trata o erro e retorna um array vazio
    console.error('Erro ao carregar as cidades', error);
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
  try {
    const response = await api.get('/usuarios'); // Rota correta para listar todos
    return response.data.map((usuario: { id: number; nome: string; cidade_id: number }) => ({
      id: usuario.id,
      nome: usuario.nome,
      cidade_id: usuario.cidade_id,
    }));
  } catch (error) {
    console.error('Erro ao carregar os usuários', error);
    return [];
  }
};
export const getRacaById = async (id: number) => {
  try {
    const response = await api.get(`/racas/${id}`);

    return {
      id: response.data.id,
      nome: response.data.nome,
    };
  } catch (error) {
    console.error(`Erro ao buscar raça com ID ${id}:`, error);
    throw error;
  }
};
export const getFaixaEtariaById = async (id: number) => {
  try {
    const response = await api.get(`/faixa-etaria/${id}`);

    return {
      id: response.data.id,
      unidade: response.data.unidade,
    };
  } catch (error) {
    console.error(`Erro ao buscar faixa etária com ID ${id}:`, error);
    throw error;
  }
};
export const getstatusById = async (id: number) => {
  try {
    const response = await api.get(`/status/${id}`);

    return {
      id: response.data.id,
      nome: response.data.nome,
    };
  } catch (error) {
    console.error(`Erro ao buscar faixa etária com ID ${id}:`, error);
    throw error;
  }
};
export const getPetsByUsuarioId = async (usuario_id: number) => {
  try {
    const response = await api.get(`/pets/usuario/${usuario_id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar os pets do usuário', error);
    return [];
  }
};

export const getUsuarioById = async (id: number) => {
  try {
    // 1. Buscar o usuário
    console.log(`Buscando usuário com ID: ${id}`);
    const response = await api.get(`/usuarios/${id}`);
    const usuario = response.data;

    const { id: userId, nome, cidade_id, estado_id } = usuario;

    if (!cidade_id || !estado_id) {
      return {
        id: userId,
        nome,
        cidade: { id: cidade_id || null, nome: cidade_id ? 'Cidade não identificada' : 'Não informada' },
        estado: { id: estado_id || null, nome: estado_id ? 'Estado não identificado' : 'Não informado' },
      };
    }

    // 2. Buscar informações da cidade utilizando a rota getCidades_Estado
    const cidadeResponse = await api.get(`/cidades/${cidade_id}/${estado_id}`);
    let nomeCidade = '';

    if (cidadeResponse.data && Array.isArray(cidadeResponse.data)) {
      const cidadeInfo = cidadeResponse.data.find((c: { id: number; nome: string }) => c.id === cidade_id);
      if (cidadeInfo) {
        nomeCidade = cidadeInfo.nome;
      }
    }

    // 3. Buscar lista de estados
    const estados = await getEstados();
    const estadoEncontrado = estados.find((e: { id: number; nome: string }) => e.id === estado_id);

    // 4. Retornar resultado final
    return {
      id: userId,
      nome,
      cidade: {
        id: cidade_id,
        nome: nomeCidade || 'Cidade não encontrada',
      },
      estado: {
        id: estado_id,
        nome: estadoEncontrado?.nome || 'Estado não encontrado',
      },
    };
  } catch (error) {
    console.error(`Erro ao buscar o usuário com ID ${id}:`, error);
    return null;
  }
};

// Chamada para obter faixa etária
export const getFaixaEtaria = async () => {
  try {
    const response = await api.get('/faixa-etaria');

    const ordemDesejada = ['Filhote', 'Jovem', 'Adulto', 'Sênior', 'Idoso'];

    return response.data
      .map(
        (faixa: {
          id: number;
          nome: string;
          idade_min: number;
          idade_max: number;
          unidade: string;
          especie_id: number;
        }) => ({
          id: faixa.id,
          nome: faixa.nome,
          idade_min: faixa.idade_min,
          idade_max: faixa.idade_max,
          unidade: faixa.unidade,
          especie_id: faixa.especie_id,
        })
      )
      .sort(
        (a: { nome: string }, b: { nome: string }) => ordemDesejada.indexOf(a.nome) - ordemDesejada.indexOf(b.nome)
      );
  } catch (error) {
    console.error('Erro ao carregar as faixas etárias', error);
    return [];
  }
};

// Chamada para obter status
export const getStatus = async () => {
  const response = await api.get('/status');
  return response.data;
};
// Chamada para obter espécies
export const getEspecies = async () => {
  try {
    const response = await api.get('/especies');
    return response.data.map((especie: { id: number; nome: string }) => ({
      id: especie.id,
      nome: especie.nome,
    }));
  } catch (error) {
    console.error('Erro ao carregar espécies', error);
    return [];
  }
};
export type Raca = {
  id: number;
  nome: string;
  especie_id: number;
};

// Chamada para obter raças
export const getRacasPorEspecie = async (especie_Id: number): Promise<Raca[]> => {
  try {
    const especiesResponse = await api.get('/especies');
    const especie = especiesResponse.data.find((e: { nome: string; id: number }) => e.id === especie_Id);

    if (!especie) {
      console.error('Espécie não encontrada:', especie_Id);
      return [];
    }

    const especieId = especie.id;
    const response = await api.get(`/racas/especie/${especieId}`);
    const racas: Raca[] = response.data.map((raca: any) => ({
      id: raca.id,
      nome: raca.nome,
      especie_id: raca.especie_id,
    }));

    return racas.sort((a: Raca, b: Raca) => a.nome.localeCompare(b.nome)); // ✅ retorno garantido
  } catch (error) {
    console.error('Erro ao carregar raças por espécie', error);
    return []; // ✅ retorno no catch
  }
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

export const getSexoPet = async () => {
  try {
    console.log('Fazendo requisição para /sexoPet');
    const response = await api.get('/sexoPet');
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
  estado_id?: number; //
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
