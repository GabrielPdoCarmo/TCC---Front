import api from '../api';

export const getDoencasPorPetId = async (petId: number) => {
  try {
    const response = await api.get(`/pets-doencas/pets/${petId}`);

    return response.data.map((item: any) => {
      return {
        pet_id: petId,
        doencaDeficiencia_id: item.doencaDeficiencia_id, // Ajustado para o nome correto da propriedade
        possui: item.possui,
      };
    });
  } catch (error) {
    console.error('Erro ao carregar doenças/deficiências do pet', error);
    return [];
  }
};
export default getDoencasPorPetId;
