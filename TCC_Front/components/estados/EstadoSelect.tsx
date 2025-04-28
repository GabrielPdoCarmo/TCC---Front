import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';

type Props = {
  estado: { id: number; nome: string } | null;
  estados: { id: number; nome: string }[];
  onSelectEstado: (selectedEstado: { id: number; nome: string }) => Promise<void>;
  showEstados: boolean;
  setShowEstados: React.Dispatch<React.SetStateAction<boolean>>;
  estadoSearch: { id: number; nome: string }; // Mantendo o tipo { id: number; nome: string }
  setEstadoSearch: React.Dispatch<React.SetStateAction<{ id: number; nome: string }>>; // Mantendo o tipo { id: number; nome: string }
};

const EstadoSelect: React.FC<Props> = ({ estado, estados, onSelectEstado, estadoSearch, setEstadoSearch }) => {
  const [estadosFiltrados, setEstadosFiltrados] = useState<{ id: number; nome: string }[]>([]); // Filtra com base em objetos
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setEstadosFiltrados(estados);
  }, [estados]);

  const normalizeText = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const handleSearch = (text: string) => {
    const textoNormalizado = normalizeText(text);

    // Filtra os estados com base no nome (texto normalizado)
    const filtrados = estados.filter((estado) => normalizeText(estado.nome).includes(textoNormalizado));

    setEstadosFiltrados(filtrados);
    setEstadoSearch({ id: -1, nome: text }); // Atualiza o estado de busca com o texto digitado como parte do objeto
  };

  const handleSelectEstado = async (estado: { id: number; nome: string }) => {
    await onSelectEstado(estado);
    setShowModal(false); // Fecha o modal após a seleção
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setShowModal(true)} // Abre o modal
      >
        <Text style={styles.pickerText}>{estado?.nome ?? 'Selecione um estado'}</Text>
      </TouchableOpacity>

      {showModal && (
        <Modal transparent={true} animationType="fade" visible={showModal} onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                placeholderTextColor="#888"
                value={estadoSearch.nome} // Exibe o nome do estado no campo de busca
                onChangeText={handleSearch}
              />

              <FlatList
                data={estadosFiltrados}
                keyExtractor={(item, index) => item?.id?.toString() ?? index.toString()}
                renderItem={({ item }) =>
                  item ? (
                    <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectEstado(item)}>
                      <Text>{item.nome ?? 'Estado desconhecido'}</Text>
                    </TouchableOpacity>
                  ) : null
                }
                ListEmptyComponent={<Text style={styles.emptyMessage}>Nenhum estado encontrado.</Text>}
              />

              <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
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
