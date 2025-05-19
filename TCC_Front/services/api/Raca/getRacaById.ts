import api from "../api";
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

export default getRacaById;