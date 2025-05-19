import api from "../api";
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
export default getFaixaEtariaById;