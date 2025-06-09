import api from '../api';

export const checkPetHasTermo = async (petId: number): Promise<boolean> => {
  try {
    const response = await api.get(`/termos-compromisso/pet/${petId}`);
    return response.data && response.data.data !== null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return false; // Pet não tem termo
    }
    // Em caso de outros erros, assumir que não tem termo para não bloquear

    return false;
  }
};

export default checkPetHasTermo;
