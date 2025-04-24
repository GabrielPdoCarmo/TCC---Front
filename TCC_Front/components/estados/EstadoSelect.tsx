import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';

type Props = {
  estado: string | null;
  estados: string[];
  onSelectEstado: (selectedEstado: string) => Promise<void>;
  showEstados: boolean;
  setShowEstados: React.Dispatch<React.SetStateAction<boolean>>;
  estadoSearch: string;
  setEstadoSearch: React.Dispatch<React.SetStateAction<string>>;
};

const EstadoSelect: React.FC<Props> = ({ estado, estados, onSelectEstado }) => {
  const handleChange = (selected: string) => {
    onSelectEstado(selected);
  };

  return (
    <View style={{ marginVertical: 10 }}>
      {estados.length === 0 ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.input}>
          <Picker
            selectedValue={estado ?? ''}
            onValueChange={handleChange}
            style={styles.picker}
            dropdownIconColor="#333" // opcional, para combinar com o estilo
          >
            <Picker.Item label="Selecione um estado" value="" />
            {estados.map((estado) => (
              <Picker.Item key={estado} label={estado} value={estado} />
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
    padding: 0,
  },
  picker: {
    height: 50,
    color: '#000',
    padding: 0,
  },
});

export default EstadoSelect;
