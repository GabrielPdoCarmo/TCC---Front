import React from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';

type CidadeDropdownProps = {
  cidade: string;
  cidades: { nome: string }[];
  cidadesFiltradas: { nome: string }[];
  cidadesCarregadas: boolean;
  loadingCidades: boolean;
  showCidades: boolean;
  setShowCidades: React.Dispatch<React.SetStateAction<boolean>>;
  cidadeSearch: string;
  onSelectCidade: (selectedCidade: { nome: string }) => void;
  onSearchCidade: (text: string) => void;
};

const CidadeDropdown: React.FC<CidadeDropdownProps> = ({
  cidade,
  cidades,
  cidadesFiltradas,
  cidadesCarregadas,
  loadingCidades,
  showCidades,
  setShowCidades,
  cidadeSearch,
  onSelectCidade,
  onSearchCidade,
}) => {
  return (
    <View>
      <TextInput
        placeholder="Buscar cidade"
        value={cidadeSearch}
        onChangeText={onSearchCidade}
        onFocus={() => setShowCidades(true)}
      />

      {showCidades && (
        <FlatList
          data={cidadesFiltradas}
          keyExtractor={(item) => item.nome}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelectCidade(item);
                setShowCidades(false);
              }}
            >
              <Text>{item.nome}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {loadingCidades && <Text>Carregando cidades...</Text>}
    </View>
  );
};

export default CidadeDropdown;
