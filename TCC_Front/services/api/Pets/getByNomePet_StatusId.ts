// 🔧 SERVIÇO API MELHORADO: getByNomePet_StatusId com debug
import api from '../api';

export const getByNomePet_StatusId = async (nome: string) => {
  try {
    console.log('🌐 Fazendo requisição para API:', `/pets/nome/${nome}/status`);

    const response = await api.get(`/pets/nome/${nome}/status`);

    // 🆕 DEBUG: Log detalhado da resposta
    console.log('📡 Resposta da API recebida:');
    console.log('📡 Status:', response.status);
    console.log('📡 Headers:', response.headers);
    console.log('📡 Data completo:', response.data);
    console.log('📡 Tipo de response.data:', typeof response.data);
    console.log('📡 response.data é array?', Array.isArray(response.data));

    if (response.data && typeof response.data === 'object') {
      console.log('📡 Chaves em response.data:', Object.keys(response.data));

      // Se response.data é um array, mostrar detalhes
      if (Array.isArray(response.data)) {
        console.log('📡 Itens no array:', response.data.length);
        response.data.forEach((item, index) => {
          console.log(`📡 Item ${index}:`, {
            id: item?.id,
            nome: item?.nome,
            status_id: item?.status_id,
            usuario_id: item?.usuario_id,
          });
        });
      }
    }

    // 🆕 VALIDAÇÃO: Verificar se há pets com status_id 4
    let petsComStatus4 = [];
    if (Array.isArray(response.data)) {
      petsComStatus4 = response.data.filter((pet) => pet.status_id === 4);
      console.log('🎯 Pets com status_id = 4 encontrados:', petsComStatus4.length);
      if (petsComStatus4.length > 0) {
        console.log('🎯 Detalhes dos pets com status 4:', petsComStatus4);
      }
    }

    return response.data;
  } catch (error) {

  }
};

export default getByNomePet_StatusId;
