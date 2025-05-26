// petsdetalhes.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal
} from 'react-native';

// Definindo a interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_nome?: string;
  idade: string;
  usuario_nome?: string;
  usuario_foto?: string | null;  // ✅ CORRIGIDO: Aceita null para foto do usuário responsável
  cidade_id?: number;
  estado_id?: number;
  cidade_nome?: string;  // Added city name property
  estado_nome?: string;  // Added state name property
  rgPet?: string;        // Added RG do Pet property
  foto?: string;
  faixa_etaria_unidade?: string;
  status_nome?: string;
  sexo_nome?: string;
  favorito?: boolean;
  motivo_doacao?: string;  // Propriedade para compatibilidade com nome snake_case
  motivoDoacao?: string;   // Propriedade para compatibilidade com nome camelCase
  doencas?: { id: number; nome: string }[];
}

interface PetCardProps {
  pet: Pet;
  onFavoriteToggle: (petId: number) => void;
  onAdoptPress: (petId: number) => void;
  onBackPress: () => void;
  loading?: boolean;
}

// Obter dimensões da tela
const { width } = Dimensions.get('window');

const PetDetalhesCard: React.FC<PetCardProps> = ({
  pet,
  onFavoriteToggle,
  onAdoptPress,
  onBackPress,
  loading = false
}) => {
  // Estado local para controlar a exibição do ícone de favorito
  const [isFavorite, setIsFavorite] = useState(pet.favorito || false);
  
  // ✅ ADICIONADO: Estado para controlar a exibição da foto ampliada
  const [showExpandedPhoto, setShowExpandedPhoto] = useState(false);

  // Atualizar o estado local quando o prop pet.favorito mudar
  useEffect(() => {
    setIsFavorite(pet.favorito || false);
  }, [pet.favorito]);

  // Função para alternar o estado do favorito
  const handleToggleFavorite = () => {
    // Atualizar o estado local imediatamente para feedback visual rápido
    setIsFavorite(!isFavorite);
    
    // Chamar a função passada via props para atualizar no backend
    if (onFavoriteToggle) {
      onFavoriteToggle(pet.id);
    }
  };

  // ✅ ADICIONADO: Função para expandir a foto do usuário
  const handleExpandUserPhoto = () => {
    if (pet.usuario_foto) {
      setShowExpandedPhoto(true);
    }
  };

  // Função para obter os nomes das doenças, se existirem
  const getDiseaseNames = () => {
    if (pet?.doencas && pet.doencas.length > 0) {
      return pet.doencas.map(d => d.nome).join(', ');
    }
    return '';
  };

  // Função para obter o motivo da doação independente do formato usado (camelCase ou snake_case)
  const getMotivo = () => {
    // Verificar qual propriedade está disponível e não vazia
    if (pet.motivoDoacao) {
      return pet.motivoDoacao;
    } else if (pet.motivo_doacao) {
      return pet.motivo_doacao;
    }
    return 'Não informado';
  };
  
  // Função para obter localização (cidade e estado)
  const getLocation = () => {
    if (pet.cidade_nome && pet.estado_nome) {
      return `${pet.cidade_nome}, ${pet.estado_nome}`;
    } else {
      return pet.cidade_id && pet.estado_id ? `ID Cidade: ${pet.cidade_id}, ID Estado: ${pet.estado_id}` : 'Localização não informada';
    }
  };

  // Função para formatar o RG do pet
  const formatRG = (text?: string): string => {
    if (!text) return 'Não informado';
    
    // Remove todos os caracteres não numéricos
    const digits = text.replace(/\D/g, '');

    // Limita a 9 dígitos (padrão RG)
    const limitedDigits = digits.slice(0, 9);

    // Aplica a formatação 00.000.000-0
    let formatted = '';

    if (limitedDigits.length > 0) {
      // Primeiros 2 dígitos
      formatted = limitedDigits.slice(0, 2);

      // Adiciona um ponto após os primeiros 2 dígitos
      if (limitedDigits.length > 2) {
        formatted += '.' + limitedDigits.slice(2, 5);

        // Adiciona outro ponto após o 5º dígito
        if (limitedDigits.length > 5) {
          formatted += '.' + limitedDigits.slice(5, 8);

          // Adiciona hífen e o último dígito
          if (limitedDigits.length > 8) {
            formatted += '-' + limitedDigits.slice(8, 9);
          }
        }
      }
    }

    return formatted;
  };

  // Verificar se há algum motivo disponível
  const motivoDoacao = getMotivo();
  console.log('Motivo de doação no componente:', motivoDoacao);
  
  // Verificar se existem doenças para mostrar
  const doencasParaMostrar = getDiseaseNames();

  // Log para verificar o valor do rgPet
  console.log('RG do Pet no componente:', pet.rgPet);
  console.log('Estado de favorito atual:', isFavorite);
  
  return (
    <View style={styles.petCardContainer}>
      <View style={styles.petCard}>
        <View style={styles.imageContainer}>
          {pet.foto ? (
            <Image source={{ uri: pet.foto }} style={styles.petImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderImage} />
          )}
        </View>

        <View style={styles.petInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nome:</Text>
            <Text style={styles.infoValue}>{pet.nome}</Text>
            <TouchableOpacity 
              style={styles.favoriteButton} 
              onPress={handleToggleFavorite}
            >
              <Image
                source={
                  isFavorite
                    ? require('../../assets/images/Icone/star-icon-open.png')
                    : require('../../assets/images/Icone/star-icon.png')
                }
                style={styles.favoriteIcon}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Raça:</Text>
            <Text style={styles.infoValue}>{pet.raca_nome || 'Desconhecido'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Idade:</Text>
            <Text style={styles.infoValue}>{pet.idade} {pet.faixa_etaria_unidade || ''}</Text>
          </View>

          {/* RG do Pet com formatação adequada */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>RG do Pet:</Text>
            <Text style={styles.infoValue}>{formatRG(pet.rgPet)}</Text>
          </View>

          {/* ✅ MODIFICADO: Responsável em linhas separadas */}
          <Text style={[styles.infoLabel, { marginBottom: 3 }]}>Responsável:</Text>
          <TouchableOpacity 
            style={styles.userInfoContainer}
            onPress={handleExpandUserPhoto}
            activeOpacity={pet.usuario_foto ? 0.7 : 1}
          >
            {pet.usuario_foto ? (
              <Image source={{ uri: pet.usuario_foto }} style={styles.userPhoto} />
            ) : (
              <View style={styles.defaultUserPhoto}>
                <Text style={styles.defaultUserPhotoText}>
                  {pet.usuario_nome ? pet.usuario_nome.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
            <Text style={styles.userName}>{pet.usuario_nome || 'Desconhecido'}</Text>
          </TouchableOpacity>

          {/* Linha para cidade e estado */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Localização:</Text>
            <Text style={styles.infoValue}>{getLocation()}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sexo:</Text>
            <Text style={styles.infoValue}>{pet.sexo_nome || 'Não informado'}</Text>
          </View>

          {/* Mostrar doenças/deficiências apenas se existirem */}
          {doencasParaMostrar.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Doenças/Deficiências:</Text>
              <Text style={styles.infoValue}>{doencasParaMostrar}</Text>
            </View>
          )}

          {/* Mostrando o motivo de doação apenas se existir algum valor */}
          {motivoDoacao !== 'Não informado' && (
            <View style={styles.motiveSection}>
              <Text style={styles.infoLabel}>Motivo de estar em Doação:</Text>
              <Text style={styles.description}>{motivoDoacao}</Text>
            </View>
          )}
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
            <Text style={styles.buttonText}>Voltar</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.adoptButton} 
            onPress={() => onAdoptPress(pet.id)}
          >
            <Text style={styles.buttonText}>Adicionar ao meus Pets</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ ADICIONADO: Modal para foto ampliada */}
      <Modal
        visible={showExpandedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExpandedPhoto(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowExpandedPhoto(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowExpandedPhoto(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            
            {pet.usuario_foto && (
              <Image 
                source={{ uri: pet.usuario_foto }} 
                style={styles.expandedPhoto}
                resizeMode="contain"
              />
            )}
            
            <Text style={styles.expandedPhotoName}>{pet.usuario_nome}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  petCardContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#F0F0F0',
  },
  petImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E1',
  },
  petInfo: {
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    width: 25,
    height: 25,
    tintColor: '#FFD700',
  },
  
  // ✅ ADICIONADO: Estilos para foto do usuário
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultUserPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4682B4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  defaultUserPhotoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 14,
    color: '#000',
  },
  
  motiveSection: {
    marginTop: 8,
  },
  description: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginTop: 4,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    gap: 10,
  },
  backButton: {
    backgroundColor: '#808080',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adoptButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // ✅ ADICIONADO: Estilos para o modal da foto ampliada
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    maxWidth: '90%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  expandedPhoto: {
    width: 250,
    height: 250,
    borderRadius: 125,
    borderWidth: 3,
    borderColor: '#4682B4',
    marginTop: 20,
  },
  expandedPhotoName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    textAlign: 'center',
  },
});

export default PetDetalhesCard;