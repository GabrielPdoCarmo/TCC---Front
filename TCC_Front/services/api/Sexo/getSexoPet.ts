import api from '../api';
export const getSexoPet = async () => {
  try {
    const response = await api.get('/sexoPet');

    return response.data.map((sexo: { id: number; descricao: string }) => ({
      id: sexo.id,
      descricao: sexo.descricao,
    }));
  } catch (error: any) {
    return [];
  }
};
export default getSexoPet;
