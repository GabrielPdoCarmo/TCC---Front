import api from "../api";

export const getUsuarioById = async (id: number) => {
  try {
    // Buscar o usuário completo
    console.log(`Buscando usuário com ID: ${id}`);
    const response = await api.get(`/usuarios/${id}`);

    // Retornar os dados completos do usuário exatamente como recebidos da API
    return response.data;
  } catch (error) {
    console.error(`Erro ao buscar o usuário com ID ${id}:`, error);
    return null;
  }
};
export default getUsuarioById;