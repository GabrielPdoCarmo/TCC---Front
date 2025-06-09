// 🔧 SERVIÇO API MELHORADO: getByNomePet_StatusId com debug
import api from '../api';

export const getByNomePet_StatusId = async (nome: string) => {
  try {
    const response = await api.get(`/pets/nome/${nome}/status`);

    // 🆕 VALIDAÇÃO: Verificar se há pets com status_id 4
    let petsComStatus4 = [];
    if (Array.isArray(response.data)) {
      petsComStatus4 = response.data.filter((pet) => pet.status_id === 4);
    }

    return response.data;
  } catch (error) {}
};

export default getByNomePet_StatusId;
