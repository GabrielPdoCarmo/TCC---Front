// petsdetalhes.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';

// Definindo a interface para o tipo Pet
interface Pet {
  id: number;
  nome: string;
  raca_nome?: string;
  idade: string;
  usuario_nome?: string;
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
              onPress={() => onFavoriteToggle(pet.id)}
            >
              <Image
                source={
                  pet.favorito
                    ? require('../../assets/images/Icone/star-icon.png')
                    : require('../../assets/images/Icone/star-icon-open.png')
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

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Responsável:</Text>
            <Text style={styles.infoValue}>{pet.usuario_nome || 'Desconhecido'}</Text>
          </View>

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
            <Text style={styles.buttonText}>Adotar</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    padding: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginRight: 5,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  favoriteButton: {
    padding: 5,
  },
  favoriteIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFD700',
  },
  motiveSection: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginTop: 5,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  backButton: {
    backgroundColor: '#808080',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginRight: 10,
  },
  adoptButton: {
    backgroundColor: '#4682B4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PetDetalhesCard;