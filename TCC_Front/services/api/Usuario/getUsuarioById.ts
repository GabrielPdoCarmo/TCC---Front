import api from '../api';

export const getUsuarioById = async (id: number) => {
  try {
    // Buscar o usuário completo

    const response = await api.get(`/usuarios/${id}`);

    // Retornar os dados completos do usuário exatamente como recebidos da API
    return response.data;
  } catch (error) {
    return null;
  }
};
export default getUsuarioById;
