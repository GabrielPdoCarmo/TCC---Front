import api from '../api';

interface PetUpdatePayload {
  id: number;
  nome?: string;
  especie_id?: number;
  raca_id?: number;
  idade?: number;
  faixa_etaria_id?: number;
  sexo_id?: number;
  rg_Pet?: string | null;
  motivoDoacao?: string;
  status_id?: number;
  doencas?: string[]; // nomes das doenças ou ids
  foto?: any; // Arquivo de imagem
}
export const updatePet = async (petData: PetUpdatePayload) => {
  try {
    const { id, ...petInfo } = petData;
    const formData = new FormData();

    // Adicionar campos ao FormData apenas se existirem
    if (petInfo.nome) formData.append('nome', petInfo.nome);
    if (petInfo.especie_id) formData.append('especie_id', String(petInfo.especie_id));
    if (petInfo.raca_id) formData.append('raca_id', String(petInfo.raca_id));
    if (petInfo.idade !== undefined) formData.append('idade', String(petInfo.idade));
    if (petInfo.faixa_etaria_id) formData.append('faixa_etaria_id', String(petInfo.faixa_etaria_id));
    if (petInfo.sexo_id) formData.append('sexo_id', String(petInfo.sexo_id));
    if (petInfo.rg_Pet !== undefined) formData.append('rg_Pet', petInfo.rg_Pet || '');
    if (petInfo.motivoDoacao) formData.append('motivoDoacao', petInfo.motivoDoacao);
    if (petInfo.status_id) formData.append('status_id', String(petInfo.status_id));

    // Adicionar doenças se existirem
    if (petInfo.doencas && Array.isArray(petInfo.doencas)) {
      petInfo.doencas.forEach((doenca, index) => {
        formData.append(`doencas[${index}]`, doenca);
      });
    }

    // Adicionar foto se existir
    if (petInfo.foto) {
      formData.append('foto', petInfo.foto);
    }

    const response = await api.put(`/pets/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    throw error;
  }
};
export default updatePet;
