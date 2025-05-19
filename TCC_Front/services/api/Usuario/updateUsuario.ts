import api from '../api';
interface UsuarioUpdatePayload {
  id: number;
  nome?: string;
  email?: string;
  cpf?: string;
  sexo_id?: number;
  telefone?: string;
  cidade_id?: number;
  estado_id?: number;
  cep?: string;
  foto?: any; // Arquivo de imagem
}

export const updateUsuario = async (usuarioData: UsuarioUpdatePayload) => {
  try {
    const { id, ...usuarioInfo } = usuarioData;
    const formData = new FormData();

    // Adicionar campos ao FormData apenas se existirem
    if (usuarioInfo.nome) formData.append('nome', usuarioInfo.nome);
    if (usuarioInfo.email) formData.append('email', usuarioInfo.email);
    if (usuarioInfo.cpf) formData.append('cpf', usuarioInfo.cpf);
    if (usuarioInfo.telefone) formData.append('telefone', usuarioInfo.telefone);
    if (usuarioInfo.cidade_id) formData.append('cidade', String(usuarioInfo.cidade_id));
    if (usuarioInfo.estado_id) formData.append('estado', String(usuarioInfo.estado_id));
    if (usuarioInfo.cep) formData.append('cep', usuarioInfo.cep);
    if (usuarioInfo.sexo_id) formData.append('sexo_id', String(usuarioInfo.sexo_id));

    // Adicionar foto se existir
    if (usuarioInfo.foto) {
      formData.append('foto', usuarioInfo.foto);
    }

    const response = await api.put(`/usuarios/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar o usuário', error);
    throw error;
  }
};
export default updateUsuario;
