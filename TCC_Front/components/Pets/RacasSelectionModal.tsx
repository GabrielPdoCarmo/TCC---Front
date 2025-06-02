import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Image,
  TextInput,
} from 'react-native';

interface RacasSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRaca: (raca: any) => void;
  racasFiltradas: any[];
  hasEspecie: boolean;
}

const RacasSelectionModal: React.FC<RacasSelectionModalProps> = ({
  visible,
  onClose,
  onSelectRaca,
  racasFiltradas,
  hasEspecie,
}) => {
  const [searchText, setSearchText] = useState('');
  
  // Função para verificar se o objeto tem a propriedade descricao
  const getDescricao = (obj: any) => {
    if (!obj) return '';
    
    // Tenta diferentes propriedades comuns para descrição
    if (obj.descricao) return obj.descricao;
    if (obj.description) return obj.description;
    if (obj.nome) return obj.nome;
    if (obj.name) return obj.name;
    
    // Se nenhuma propriedade esperada for encontrada, retorna uma representação do objeto
    return JSON.stringify(obj);
  };

  // Filtra as raças com base no texto de pesquisa
  const filteredRacas = searchText.trim() === '' 
    ? racasFiltradas 
    : racasFiltradas.filter(raca => {
        const descricao = getDescricao(raca).toLowerCase();
        return descricao.includes(searchText.toLowerCase());
      });
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.racasModalContainer}>
        <View style={styles.racasModalContent}>
          <View style={styles.racasModalHeader}>
            <Text style={styles.racasModalTitle}>Selecionar Raça</Text>
            <TouchableOpacity onPress={onClose}>
              <Image
                source={require('../../assets/images/Icone/close-icon.png')}
                style={styles.closeIcon}
              />
            </TouchableOpacity>
          </View>

          {/* Campo de pesquisa */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Pesquisar raças..."
              value={searchText}
              onChangeText={setSearchText}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          
          {!hasEspecie ? (
            <Text style={styles.infoText}>
              Selecione uma espécie primeiro
            </Text>
          ) : racasFiltradas.length === 0 ? (
            <Text style={styles.infoText}>
              Carregando raças...
            </Text>
          ) : (
            <FlatList
              data={filteredRacas}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.racaItem}
                  onPress={() => onSelectRaca(item)}>
                  <Text style={styles.racaItemText}>{getDescricao(item)}</Text>
                </TouchableOpacity>
              )}
              style={styles.racasList}
              ListEmptyComponent={
                <Text style={styles.infoText}>
                  Nenhuma raça encontrada para a pesquisa.
                </Text>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  racasModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  racasModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  racasModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  racasModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  racaItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  racaItemText: {
    fontSize: 16,
  },
  racasList: {
    maxHeight: 300,
  },
  racasModalCloseButton: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 15,
  },
  racasModalCloseButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  infoText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
    padding: 20,
  },
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
});

export default RacasSelectionModal;