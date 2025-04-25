import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';

type Props = {
  cidade: string;
  cidades: { nome: string }[];
  cidadesCarregadas: boolean;
  loadingCidades: boolean;
  showCidades: boolean;
  setShowCidades: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectCidade: (selectedCidade: { nome: string }) => void;
  toggleCidades: () => void;
};

const CidadeSelect: React.FC<Props> = ({
  cidade,
  cidades,
  loadingCidades,
  onSelectCidade,
}) => {
  const [cidadeSearch, setCidadeSearch] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState<{ nome: string }[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setCidadesFiltradas(cidades); // inicializa com todas
  }, [cidades]);

  const normalizeText = (text: string) =>
    text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const handleSearch = (text: string) => {
    setCidadeSearch(text);
    const textoNormalizado = normalizeText(text);

    const filtradas = cidades.filter((c) =>
      normalizeText(c.nome).includes(textoNormalizado)
    );

    setCidadesFiltradas(filtradas);
  };

  const handleSelectCidade = (cidade: { nome: string }) => {
    onSelectCidade(cidade);
    setShowModal(false); // fecha o modal ao selecionar a cidade
  };

  const inputStyle = {
    ...styles.input,
    borderColor: cidade ? '#4CAF50' : '#ccc',
  };

  return (
    <View>
      {loadingCidades ? (
        <ActivityIndicator />
      ) : (
        <>
          <TouchableOpacity
            style={inputStyle}
            onPress={() => setShowModal(true)} // abre o modal
          >
            <Text style={styles.pickerText}>
              {cidade || 'Selecione uma cidade'}
            </Text>
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
                    placeholder="Buscar cidade..."
                    placeholderTextColor="#888"
                    value={cidadeSearch}
                    onChangeText={handleSearch}
                  />

                  <FlatList
                    data={cidadesFiltradas}
                    keyExtractor={(item) => item.nome}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.modalItem}
                        onPress={() => handleSelectCidade(item)}
                      >
                        <Text>{item.nome}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                      <Text style={styles.emptyMessage}>Nenhuma cidade encontrada.</Text>
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
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchInput: {
    height: 35,
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


export default CidadeSelect;
