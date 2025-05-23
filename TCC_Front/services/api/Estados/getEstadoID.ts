import api from '../api';

type Estado = {
  id: number;
  nome: string;
};
export const getEstadoID = async (estadoID: number): Promise<Estado | null> => {
  try {
    const response = await api.get(`/estados/${estadoID}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar estado por ID', error);
    return null;
  }
};
export default getEstadoID;