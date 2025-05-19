import api from "../api";
export const getSexoPetById = async (id: number) => {
  try {
    const response = await api.get(`/sexoPet/${id}`);
    return {
      id: response.data.id,
      descricao: response.data.descricao,
    };
  } catch (error) {
    console.error(`Erro ao buscar sexo do pet com ID ${id}:`, error);
    throw error;
  }
};
export default getSexoPetById;