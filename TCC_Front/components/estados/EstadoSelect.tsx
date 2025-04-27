import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';

type Props = {
  estado: string | null;
  estados: string[];
  onSelectEstado: (selectedEstado: string) => Promise<void>;
  showEstados: boolean;
  setShowEstados: React.Dispatch<React.SetStateAction<boolean>>;
  estadoSearch: string;
  setEstadoSearch: React.Dispatch<React.SetStateAction<string>>;
};

const EstadoSelect: React.FC<Props> = ({ estado, estados, onSelectEstado, estadoSearch, setEstadoSearch }) => {
  const [estadosFiltrados, setEstadosFiltrados] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setEstadosFiltrados(estados); // Inicializa com todos os estados
  }, [estados]);

  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const handleSearch = (text: string) => {
    setEstadoSearch(text);
    const textoNormalizado = normalizeText(text);

    const filtrados = estados.filter((estado) =>
      normalizeText(estado).includes(textoNormalizado)
    );

    setEstadosFiltrados(filtrados);
  };

  const handleSelectEstado = (estado: string) => {
    onSelectEstado(estado);
    setShowModal(false); // Fecha o modal ao selecionar o estado
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowModal(true)} // Abre o modal
      >
        <Text style={styles.pickerText}>{estado ?? 'Selecione um estado'}</Text>
      </TouchableOpacity>

      {showModal && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showModal}
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                placeholderTextColor="#888"
                value={estadoSearch}
                onChangeText={handleSearch}
              />

              <FlatList
                data={estadosFiltrados}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => handleSelectEstado(item)}
                  >
                    <Text>{item}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyMessage}>Nenhum estado encontrado.</Text>
                }
              />

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    height: 45,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 5,
    backgroundColor: '#fff',
    color: '#000',
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    marginTop: 5,
    padding: 0,
  },
  pickerText: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#000',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 400,
    maxHeight: 500,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  modalItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  closeButton: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyMessage: {
    marginTop: 8,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default EstadoSelect;
