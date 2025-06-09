import api from '../api';
export const getMeusDoacoes = async () => {
  try {
    const response = await api.get('/termos-compromisso/meus-doacoes');
    return response.data;
  } catch (error) {
    throw error;
  }
};
export default getMeusDoacoes;
