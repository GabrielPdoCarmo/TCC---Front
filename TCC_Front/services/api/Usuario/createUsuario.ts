import api from "../api";

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
export default createUsuario;