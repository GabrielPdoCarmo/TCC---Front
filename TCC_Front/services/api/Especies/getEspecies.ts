import api from "../api";
export const getEspecies = async () => {
  try {
    const response = await api.get('/especies');
    return response.data.map((especie: { id: number; nome: string }) => ({
      id: especie.id,
      nome: especie.nome,
    }));
  } catch (error) {
    console.error('Erro ao carregar espécies', error);
    return [];
  }
};
export default getEspecies;