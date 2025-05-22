import api from '../api';

export const getPetsByAgeRange = async (faixa_etaria_id: number, idade: number) => {
  try {
    const response = await api.get(`/pets/faixa-etaria/${faixa_etaria_id}/idade/${idade}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao carregar pets por faixa etária e idade', error);
    return [];
  }
};

export default getPetsByAgeRange;