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
interface PetPayload {
  nome: string;
  especie_id: number;
  raca_id: number;
  idade: number;
  faixa_etaria_id: number;
  usuario_id: number;
  sexo_id: number;
  motivoDoacao: string;
  status_id: number;
  quantidade: number;
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
    formData.append('motivoDoacao', petData.motivoDoacao);
    formData.append('status_id', String(petData.status_id));
    formData.append('quantidade', String(petData.quantidade));

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

export const getUsuarioById = async (id: number) => {
  try {
    // Busca o usuário
    const response = await api.get(`/usuarios/${id}`);
    const { id: userId, nome, cidade_id } = response.data;

    // Busca a cidade para pegar o estado_id
    const cidadeResponse = await api.get(`/cidades/${cidade_id}`);
    const { nome: nomeCidade, estado_id } = cidadeResponse.data;

    // Busca o estado pelo ID
    const estadoResponse = await api.get(`/estados/${estado_id}`);
    const { nome: nomeEstado } = estadoResponse.data;

    return {
      id: userId,
      nome,
      cidade: {
        id: cidade_id,
        nome: nomeCidade
      },
      estado: {
        id: estado_id,
        nome: nomeEstado
      }
    };
  } catch (error) {
    console.error(`Erro ao buscar o usuário com ID ${id}`, error);
    return null;
  }
};


// Chamada para obter faixa etária
export const getFaixaEtaria = async () => {
  try {
    const response = await api.get('/faixa-etaria');

    const ordemDesejada = ['Filhote', 'Jovem', 'Adulto', 'Sênior', 'Idoso'];

    return response.data
      .map((faixa: {
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
      }))
      .sort((a: { nome: string }, b: { nome: string }) =>
        ordemDesejada.indexOf(a.nome) - ordemDesejada.indexOf(b.nome)
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

// Chamada para obter doenças e deficiências
export const getDoencasDeficiencias = async () => {
  try {
    const response = await api.get('/doencas-deficiencias');
    return response.data.map((item: { id: number; nome: string }) => ({
      id: item.id,
      nome: item.nome,
    }));
  } catch (error) {
    console.error('Erro ao carregar doenças/deficiências', error);
    return [];
  }
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
export const getRacasPorEspecie = async (especieId: number): Promise<Raca[]> => {
  try {
    const response = await api.get(`/racas/${especieId}`);
    const racas: Raca[] = response.data.map((raca: any) => ({
      id: raca.id,
      nome: raca.nome,
      especie_id: raca.especie_id,
    }));

    return racas.sort((a: Raca, b: Raca) => a.nome.localeCompare(b.nome));
  } catch (error) {
    console.error('Erro ao carregar raças por espécie', error);
    return [];
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
