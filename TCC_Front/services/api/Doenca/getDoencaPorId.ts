import api from "../api";
export const getDoencaPorId = async (id: number) => {
  try {
    const response = await api.get(`/doencasdeficiencias/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erro ao carregar a doença/deficiência com ID ${id}`, error);
    return null;
  }
};
export default getDoencaPorId;