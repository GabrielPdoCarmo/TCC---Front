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
  foto?: any; // Pode ser string (URL) ou objeto (arquivo)
}

export const updatePet = async (petData: PetUpdatePayload) => {
  try {
    const { id, ...petInfo } = petData;

    // ✅ VERIFICAR SE É NECESSÁRIO USAR FORMDATA COM LOGS DETALHADOS
    const temNovaFoto =
      petInfo.foto && typeof petInfo.foto === 'object' && petInfo.foto.uri && petInfo.foto.uri.startsWith('file://');

    if (temNovaFoto) {
      // ✅ USAR FORMDATA APENAS QUANDO TEM NOVA FOTO

      const formData = new FormData();

      // Adicionar campos básicos ao FormData apenas se existirem
      if (petInfo.nome) {
        formData.append('nome', petInfo.nome);
      }

      if (petInfo.especie_id) {
        formData.append('especie_id', String(petInfo.especie_id));
      }

      if (petInfo.raca_id) {
        formData.append('raca_id', String(petInfo.raca_id));
      }

      if (petInfo.idade !== undefined) {
        formData.append('idade', String(petInfo.idade));
      }

      if (petInfo.faixa_etaria_id) {
        formData.append('faixa_etaria_id', String(petInfo.faixa_etaria_id));
      }

      if (petInfo.sexo_id) {
        formData.append('sexo_id', String(petInfo.sexo_id));
      }

      if (petInfo.rg_Pet !== undefined) {
        formData.append('rg_Pet', petInfo.rg_Pet || '');
      }

      if (petInfo.motivoDoacao) {
        formData.append('motivoDoacao', petInfo.motivoDoacao);
      }

      if (petInfo.status_id) {
        formData.append('status_id', String(petInfo.status_id));
      }

      // Processar doenças
      if (petInfo.doencas && Array.isArray(petInfo.doencas)) {
        petInfo.doencas.forEach((doenca, index) => {
          formData.append(`doencas[${index}]`, doenca);
        });
      }

      // ✅ PROCESSAR NOVA FOTO PARA FORMDATA COM VALIDAÇÕES
      if (petInfo.foto && petInfo.foto.uri) {
        const fotoFile = {
          uri: petInfo.foto.uri,
          type: petInfo.foto.type || 'image/jpeg',
          name: petInfo.foto.name || `pet_${Date.now()}.jpg`,
        } as any;

        formData.append('foto', fotoFile);
      } else {
        throw new Error('Foto selecionada não tem URI válida');
      }

      // ✅ ENVIAR COM FORMDATA E TIMEOUT MAIOR

      const response = await api.put(`/pets/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000, // 45 segundos para upload de foto
      });

      return response.data;
    } else {
      // ✅ USAR JSON QUANDO NÃO TEM NOVA FOTO

      const jsonPayload = { ...petInfo };

      // Processar foto existente ou remoção
      if (petInfo.foto === null || petInfo.foto === '') {
        jsonPayload.foto = ''; // String vazia para remoção
      } else if (typeof petInfo.foto === 'string' && petInfo.foto.startsWith('http')) {
        jsonPayload.foto = petInfo.foto;
      } else {
        // Não alterar a foto se não é válida
        delete jsonPayload.foto;
      }

      // ✅ ENVIAR COM JSON
      const response = await api.put(`/pets/${id}`, jsonPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      return response.data;
    }
  } catch (error: any) {}
};

export default updatePet;
