import api from '../api';

interface PetPayload {
  nome: string;
  especie_id: number;
  raca_id: number;
  idade: number;
  faixa_etaria_id: number;
  usuario_id: number;
  doador_id?: number; // ID do doador, opcional
  adotante_id?: null; // ID do adotante, opcional
  sexo_id: number;
  rg_Pet: string | null; // RG do pet, pode ser nulo
  motivoDoacao: string;
  descricaoGeral: string; // descrição geral do pet
  status_id: number;
  doencas: string[]; // nomes das doenças
  foto?: File | null;
}

export const postPet = async (petData: PetPayload) => {
  try {
    const formData = new FormData();

    formData.append('nome', petData.nome);
    formData.append('especie_id', String(petData.especie_id));
    formData.append('raca_id', String(petData.raca_id));
    formData.append('idade', String(petData.idade));
    formData.append('faixa_etaria_id', String(petData.faixa_etaria_id));
    formData.append('usuario_id', String(petData.usuario_id));
    formData.append('doador_id', String(petData.usuario_id)); // Doador é o usuário que está criando o pet
    formData.append('adotante_id', String(null)); // Adotante é nulo inicialmente
    formData.append('sexo_id', String(petData.sexo_id));
    formData.append('rg_Pet', petData.rg_Pet || ''); // Envia string vazia se rg_Pet for nulo
    formData.append('motivoDoacao', petData.motivoDoacao);
    if (!petData.descricaoGeral || petData.descricaoGeral.trim() === '') {
      throw new Error('Descrição geral é obrigatória');
    }
    formData.append('descricaoGeral', petData.descricaoGeral.trim());

    formData.append('status_id', String(petData.status_id));

    petData.doencas.forEach((nome, index) => {
      formData.append(`doencas[${index}]`, nome);
    });

    if (petData.foto) {
      formData.append('foto', petData.foto);
    }

    const response = await api.post('/pets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    return null;
  }
};
export default postPet;
