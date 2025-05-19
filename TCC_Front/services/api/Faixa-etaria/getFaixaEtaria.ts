import api from '../api';
export const getFaixaEtaria = async () => {
  try {
    const response = await api.get('/faixa-etaria');

    const ordemDesejada = ['Filhote', 'Jovem', 'Adulto', 'Sênior', 'Idoso'];

    return response.data
      .map(
        (faixa: {
          id: number;
          nome: string;
          idade_min: number;
          idade_max: number;
          unidade: string;
          especie_id: number;
        }) => ({
          id: faixa.id,
          nome: faixa.nome,
          idade_min: faixa.idade_min,
          idade_max: faixa.idade_max,
          unidade: faixa.unidade,
          especie_id: faixa.especie_id,
        })
      )
      .sort(
        (a: { nome: string }, b: { nome: string }) => ordemDesejada.indexOf(a.nome) - ordemDesejada.indexOf(b.nome)
      );
  } catch (error) {
    console.error('Erro ao carregar as faixas etárias', error);
    return [];
  }
};
export default getFaixaEtaria;
