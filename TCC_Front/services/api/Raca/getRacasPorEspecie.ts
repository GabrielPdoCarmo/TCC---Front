import api from "../api";
export type Raca = {
  id: number;
  nome: string;
  especie_id: number;
};
export const getRacasPorEspecie = async (especie_Id: number): Promise<Raca[]> => {
  try {
    const especiesResponse = await api.get('/especies');
    const especie = especiesResponse.data.find((e: { nome: string; id: number }) => e.id === especie_Id);

    if (!especie) {
      console.error('Espécie não encontrada:', especie_Id);
      return [];
    }

    const especieId = especie.id;
    const response = await api.get(`/racas/especie/${especieId}`);
    const racas: Raca[] = response.data.map((raca: any) => ({
      id: raca.id,
      nome: raca.nome,
      especie_id: raca.especie_id,
    }));

    return racas.sort((a: Raca, b: Raca) => a.nome.localeCompare(b.nome)); // ✅ retorno garantido
  } catch (error) {
    console.error('Erro ao carregar raças por espécie', error);
    return []; // ✅ retorno no catch
  }
};
export default getRacasPorEspecie;