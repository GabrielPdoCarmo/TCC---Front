import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';

type CidadeItem = { id: number; nome: string }; // Updated to make id optional

type Props = {
  cidade: { id: number; nome: string } | null;
  cidades: CidadeItem[]; // Using the new type
  cidadesCarregadas: boolean;
  loadingCidades: boolean;
  showCidades: boolean;
  setShowCidades: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectCidade: (selectedCidade: { id: number; nome: string }) => void;
  toggleCidades: () => void;
  disabled: boolean;
};

const CidadeSelect: React.FC<Props> = ({
  cidade,
  cidades,
  cidadesCarregadas,
  loadingCidades,
  onSelectCidade,
  disabled,
}) => {
  const [cidadeSearch, setCidadeSearch] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState<CidadeItem[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loadingCidades) {
      setCidadesFiltradas(cidades);
    }
  }, [cidades, loadingCidades]);
  

  const normalizeText = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const handleSearch = (text: string) => {
    setCidadeSearch(text);
    const textoNormalizado = normalizeText(text);

    const filtradas = cidades.filter((c) => normalizeText(c.nome).includes(textoNormalizado));

    setCidadesFiltradas(filtradas);
  };

  const handleSelectCidade = (cidade: CidadeItem) => {
    // Fix: Ensure id is present before passing to onSelectCidade
    // If id is missing, provide a default value or generate one
    onSelectCidade({
      id: cidade.id || -1, // Using -1 as default if id is missing
      nome: cidade.nome,
    });
    setShowModal(false);
  };

  const inputStyle = {
    ...styles.input,
    borderColor: cidade ? '#4CAF50' : '#ccc',
    backgroundColor: disabled ? '#eee' : '#fff',
  };

  return (
    <View>
      {loadingCidades ? (
        <ActivityIndicator />
      ) : (
        <>
          <TouchableOpacity
            style={inputStyle}
            onPress={() => !disabled && setShowModal(true)}
            activeOpacity={disabled ? 1 : 0.7}
            disabled={disabled}
          >
            <Text style={[styles.pickerText, { color: disabled ? '#888' : '#000' }]}>
              {cidade?.nome || 'Selecione uma cidade'}
            </Text>
          </TouchableOpacity>

          {showModal && !disabled && (
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
                      <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCidade(item)}>
                        <Text>{item.nome}</Text>
                      </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyMessage}>Nenhuma cidade encontrada.</Text>}
                  />
                  <TouchableOpacity style={styles.closeButton} onPress={() => setShowModal(false)}>
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

export default CidadeSelect;
