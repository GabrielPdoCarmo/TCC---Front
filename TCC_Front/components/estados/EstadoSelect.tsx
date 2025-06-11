import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, TextInput, Modal, TouchableOpacity, FlatList } from 'react-native';

type Props = {
  estado: { id: number; nome: string } | null;
  estados: { id: number; nome: string }[];
  onSelectEstado: (selectedEstado: { id: number; nome: string }) => Promise<void>;
  showEstados: boolean;
  setShowEstados: React.Dispatch<React.SetStateAction<boolean>>;
  estadoSearch: { id: number; nome: string };
  setEstadoSearch: React.Dispatch<React.SetStateAction<{ id: number; nome: string }>>;
  disabled?: boolean; // 🆕 ADICIONADA: Prop disabled opcional
};

const EstadoSelect: React.FC<Props> = ({ 
  estado, 
  estados, 
  onSelectEstado, 
  estadoSearch, 
  setEstadoSearch, 
  disabled = false // 🆕 ADICIONADO: Default false
}) => {
  const [estadosFiltrados, setEstadosFiltrados] = useState<{ id: number; nome: string }[]>([]);
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
    setEstadoSearch({ id: -1, nome: text });
  };

  const handleSelectEstado = async (estado: { id: number; nome: string }) => {
    if (disabled) return; // 🆕 ADICIONADO: Bloquear se desabilitado

    await onSelectEstado(estado);
    setShowModal(false);
  };

  // 🆕 ADICIONADO: Função para abrir modal com verificação de disabled
  const handleOpenModal = () => {
    if (disabled) return; // Não abrir se desabilitado
    setShowModal(true);
  };

  // 🆕 ADICIONADO: Estilo dinâmico baseado no estado disabled
  const inputStyle = {
    ...styles.input,
    backgroundColor: disabled ? '#f5f5f5' : '#fff',
    borderColor: disabled ? '#ccc' : '#000',
    opacity: disabled ? 0.6 : 1,
  };

  const textStyle = {
    ...styles.pickerText,
    color: disabled ? '#999' : '#000',
  };

  return (
    <View>
      <TouchableOpacity
        style={inputStyle}
        onPress={handleOpenModal} // 🆕 ATUALIZADO: Usar função com verificação
        disabled={disabled} // 🆕 ADICIONADO: Prop disabled
        activeOpacity={disabled ? 1 : 0.7} // 🆕 ADICIONADO: Sem feedback visual se desabilitado
      >
        <Text style={textStyle}>
          {estado?.nome ?? 'Selecione um estado'}
        </Text>
      </TouchableOpacity>

      {/* 🆕 ATUALIZADO: Só mostrar modal se não estiver desabilitado */}
      {showModal && !disabled && (
        <Modal transparent={true} animationType="fade" visible={showModal} onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar estado..."
                placeholderTextColor="#888"
                value={estadoSearch.nome}
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