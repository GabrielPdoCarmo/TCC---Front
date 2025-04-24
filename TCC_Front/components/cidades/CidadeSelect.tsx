import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
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
  toggleCidades: () => void;
};

const CidadeSelect: React.FC<Props> = ({ cidade, cidadesFiltradas, loadingCidades, onSelectCidade }) => {
  const handleChange = (selected: string) => {
    const cidadeObj = cidadesFiltradas.find((c) => c.nome === selected);
    if (cidadeObj) {
      onSelectCidade(cidadeObj);
    }
  };

  return (
    <View>
      {loadingCidades ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.input}>
          <Picker selectedValue={cidade} onValueChange={handleChange} style={styles.picker} dropdownIconColor="#333">
            <Picker.Item label="Selecione uma cidade" value="" />
            {cidadesFiltradas.map((cidade) => (
              <Picker.Item key={cidade.nome} label={cidade.nome} value={cidade.nome} />
            ))}
          </Picker>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginTop: 5,
    
  },
  picker: {
    height: 50,
    color: '#000',
    padding: 0,
  },
});

export default CidadeSelect;
