import api from '../api';

interface UsuarioPayload {
  nome: string;
  sexo_id: number;
  telefone: string;
  email: string;
  senha: string;
  cpf: string;
  cidade_id: number;
  estado_id?: number; 
  cep?: string;
  foto?: File | null;
}

export const createUsuario = async (usuarioData: UsuarioPayload) => {
  try {
    const formData = new FormData();

    formData.append('nome', usuarioData.nome);
    formData.append('sexo_id', String(usuarioData.sexo_id));
    formData.append('telefone', usuarioData.telefone);
    formData.append('email', usuarioData.email);
    formData.append('senha', usuarioData.senha);
    formData.append('cpf', usuarioData.cpf);
    formData.append('cidade_id', String(usuarioData.cidade_id));
    formData.append('estado_id', String(usuarioData.estado_id )); // Envia string vazia se estado_id for nulo

    if (usuarioData.cep) {
      formData.append('cep', usuarioData.cep);
    }

    if (usuarioData.foto) {
      formData.append('foto', usuarioData.foto);
    }

    const response = await api.post('/usuarios', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar o usuário', error);
    throw error || { error: 'Erro ao criar usuário' };
  }
};

export default createUsuario;
