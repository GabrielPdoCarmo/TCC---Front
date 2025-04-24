import React from 'react';
import { View, TextInput, FlatList, TouchableOpacity, Text } from 'react-native';

type EstadoDropdownProps = {
  estado: string | null;
  estados: string[];
  onSelectEstado: (selectedEstado: string) => Promise<void>;
  showEstados: boolean;
  setShowEstados: React.Dispatch<React.SetStateAction<boolean>>;
  estadoSearch: string;
  setEstadoSearch: React.Dispatch<React.SetStateAction<string>>;
};

const EstadoDropdown: React.FC<EstadoDropdownProps> = ({
  estado,
  estados,
  onSelectEstado,
  showEstados,
  setShowEstados,
  estadoSearch,
  setEstadoSearch,
}) => {
  return (
    <View>
      <TextInput
        placeholder="Buscar estado"
        value={estadoSearch}
        onChangeText={setEstadoSearch}
        onFocus={() => setShowEstados(true)}
      />

      {showEstados && (
        <FlatList
          data={estados.filter((e) => e.toLowerCase().includes(estadoSearch.toLowerCase()))}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={async () => {
                await onSelectEstado(item);
                setShowEstados(false);
              }}
            >
              <Text>{item}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default EstadoDropdown;
