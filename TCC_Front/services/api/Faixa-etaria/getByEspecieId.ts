import api from '../api';

const ordemDesejada = ['Filhote', 'Jovem', 'Adulto', 'Sênior', 'Idoso'];

export const getFaixaEtariaByEspecieId = async (especieId: number) => {
  try {
    const response = await api.get(`/faixa-etaria/especie/${especieId}`);
    return response.data
      .map(
        (faixaEtaria: {
          id: number;
          unidade: string;
          nome: string;
          idade_min: number;
          idade_max: number;
          especie_id: number;
        }) => ({
          id: faixaEtaria.id,
          unidade: faixaEtaria.unidade,
          nome: faixaEtaria.nome,
          idade_min: faixaEtaria.idade_min,
          idade_max: faixaEtaria.idade_max,
          especie_id: faixaEtaria.especie_id || especieId, // Adiciona o especie_id ou usa o especieId passado
        })
      )
      .sort(
        (a: { nome: string }, b: { nome: string }) => 
          ordemDesejada.indexOf(a.nome) - ordemDesejada.indexOf(b.nome)
      );
  } catch (error) {
    console.error('Erro ao carregar faixas etárias por ID da espécie', error);
    return [];
  }
};
export default getFaixaEtariaByEspecieId;