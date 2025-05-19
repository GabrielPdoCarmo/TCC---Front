import api from "../api";
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

export default getstatusById;