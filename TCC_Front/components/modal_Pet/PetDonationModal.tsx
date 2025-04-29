import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router'; // Importando useRouter
import {
  getDoencasDeficiencias,
  getEspecies,
  getRacas,
  getFaixaEtaria,
  getUsuarioById,
  postPet,
} from '../../services/api';

// Tipos
interface PetDonationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
}

interface FormData {
  especie: string;
  nome: string;
  quantidade: string;
  raca: string;
  idadeCategoria: string;
  idade: string;
  responsavel: string;
  estado: string;
  cidade: string;
  sexo: string;
  possuiDoenca: string;
  doencaDescricao: string;
  motivoDoacao: string;
  foto: string | null;
}

const PetDonationModal: React.FC<PetDonationModalProps> = ({ visible, onClose, onSubmit }) => {
  const router = useRouter(); // Inicializando o router

  // Estado inicial do formulário
  const [formData, setFormData] = useState<FormData>({
    especie: '',
    nome: '',
    quantidade: '',
    raca: '',
    idadeCategoria: '',
    idade: '',
    responsavel: '',
    estado: '',
    cidade: '',
    sexo: '',
    possuiDoenca: '',
    doencaDescricao: '',
    motivoDoacao: '',
    foto: null,
  });

  // Função para atualizar o estado do formulário
  const handleChange = (name: keyof FormData, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Função para lidar com o envio do formulário
  const handleSubmit = () => {
    // Validação dos campos obrigatórios
    if (!formData.nome || !formData.quantidade || !formData.especie) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Envia os dados do formulário para a função onSubmit passada como prop
    onSubmit(formData);

    // Reseta o formulário
    setFormData({
      especie: '',
      nome: '',
      quantidade: '',
      raca: '',
      idadeCategoria: '',
      idade: '',
      responsavel: '',
      estado: '',
      cidade: '',
      sexo: '',
      possuiDoenca: '',
      doencaDescricao: '',
      motivoDoacao: '',
      foto: null,
    });
  };

  // Função para tratar o fechamento e navegação
  const handleCloseAndNavigate = () => {
    onClose(); // Fecha o modal
    router.push('/pages/PetDonation'); // Navega para a tela PetDonation
  };

  // Componente RadioButton personalizado
  const RadioButton: React.FC<{
    selected: boolean;
    onPress: () => void;
    label: string;
  }> = ({ selected, onPress, label }) => (
    <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
      <View style={[styles.radioOuter, selected && styles.selectedRadioOuter]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Cabeçalho do Modal */}

          {/* Título do Formulário */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>Dados Do Pet</Text>
            <TouchableOpacity onPress={handleCloseAndNavigate}>
              <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>

          {/* Formulário em ScrollView */}
          <ScrollView style={styles.formContainer}>
            {/* Espécie */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Especie <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioRow}>
                <RadioButton
                  selected={formData.especie === 'Cachorro'}
                  onPress={() => handleChange('especie', 'Cachorro')}
                  label="Cachorro"
                />
                <RadioButton
                  selected={formData.especie === 'Gatos'}
                  onPress={() => handleChange('especie', 'Gatos')}
                  label="Gatos"
                />
                <RadioButton
                  selected={formData.especie === 'Aves'}
                  onPress={() => handleChange('especie', 'Aves')}
                  label="Aves"
                />
                <RadioButton
                  selected={formData.especie === 'Roedores'}
                  onPress={() => handleChange('especie', 'Roedores')}
                  label="Roedores"
                />
              </View>
            </View>

            {/* Nome */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nome"
                value={formData.nome}
                onChangeText={(value) => handleChange('nome', value)}
              />
            </View>

            {/* Quantidade */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Quantidade <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Quantidade"
                keyboardType="numeric"
                value={formData.quantidade}
                onChangeText={(value) => handleChange('quantidade', value)}
              />
            </View>

            {/* Raça */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Raça <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => Alert.alert('Raças', 'Lista de raças será implementada aqui.')}
              >
                <Text style={styles.dropdownText}>{formData.raca || 'Raça'}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Idade */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Idade <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.ageContainer}>
                <View style={styles.radioGridRow}>
                  <RadioButton
                    selected={formData.idadeCategoria === 'Filhote'}
                    onPress={() => handleChange('idadeCategoria', 'Filhote')}
                    label="Filhote"
                  />
                  <RadioButton
                    selected={formData.idadeCategoria === 'Jovem'}
                    onPress={() => handleChange('idadeCategoria', 'Jovem')}
                    label="Jovem"
                  />
                  <RadioButton
                    selected={formData.idadeCategoria === 'Adultos'}
                    onPress={() => handleChange('idadeCategoria', 'Adultos')}
                    label="Adultos"
                  />
                </View>
                <View style={styles.radioGridRow}>
                  <RadioButton
                    selected={formData.idadeCategoria === 'Senior'}
                    onPress={() => handleChange('idadeCategoria', 'Senior')}
                    label="Senior"
                  />
                  <RadioButton
                    selected={formData.idadeCategoria === 'Idoso'}
                    onPress={() => handleChange('idadeCategoria', 'Idoso')}
                    label="Idoso"
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Idade"
                  value={formData.idade}
                  onChangeText={(value) => handleChange('idade', value)}
                />
              </View>
            </View>

            {/* Responsável */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Responsável <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Responsável - (Nome do Usuário)"
                value={formData.responsavel}
                onChangeText={(value) => handleChange('responsavel', value)}
              />
            </View>

            {/* Estado */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Estado <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => Alert.alert('Estados', 'Lista de estados será implementada aqui.')}
              >
                <Text style={styles.dropdownText}>{formData.estado || 'Estado - (Estado do Usuário)'}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Cidade */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => Alert.alert('Cidades', 'Lista de cidades será implementada aqui.')}
              >
                <Text style={styles.dropdownText}>{formData.cidade || 'Cidade - (Cidade do Usuário)'}</Text>
                <Text style={styles.dropdownIcon}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Sexo */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Sexo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioRow}>
                <RadioButton
                  selected={formData.sexo === 'Macho'}
                  onPress={() => handleChange('sexo', 'Macho')}
                  label="Macho"
                />
                <RadioButton
                  selected={formData.sexo === 'Femea'}
                  onPress={() => handleChange('sexo', 'Femea')}
                  label="Femea"
                />
              </View>
            </View>

            {/* Doença/Deficiência */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Possui Doença/Deficiência <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.radioRow}>
                <RadioButton
                  selected={formData.possuiDoenca === 'Sim'}
                  onPress={() => handleChange('possuiDoenca', 'Sim')}
                  label="Sim"
                />
                <RadioButton
                  selected={formData.possuiDoenca === 'Não'}
                  onPress={() => handleChange('possuiDoenca', 'Não')}
                  label="Não"
                />
              </View>
            </View>

            {/* Descrição Doença - Mostrar apenas se possuiDoenca for "Sim" */}
            {formData.possuiDoenca === 'Sim' && (
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Se sim, comente qual seria</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doença/Deficiência"
                  value={formData.doencaDescricao}
                  onChangeText={(value) => handleChange('doencaDescricao', value)}
                />
              </View>
            )}

            {/* Motivo da Doação */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Motivo de estar em Doação <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Motivo de estar em Doação"
                multiline
                numberOfLines={4}
                value={formData.motivoDoacao}
                onChangeText={(value) => handleChange('motivoDoacao', value)}
              />
            </View>

            {/* Foto */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>
                Foto <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.photoUploadButton}
                onPress={() =>
                  Alert.alert('Upload de Foto', 'Funcionalidade de upload de foto será implementada aqui.')
                }
              >
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.uploadText}>Selecionar foto</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.saveButtonText}>Salvar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  modalContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4B99FB',
    padding: 15,
    paddingTop: Platform.OS === 'ios' ? 50 : 15,
  },
  backButton: {
    padding: 5,
  },
  backIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 15,
  },
  headerIcon: {
    width: 24,
    height: 24,
  },
  formHeader: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 15,
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  required: {
    color: 'red',
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  radioOuter: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRadioOuter: {
    borderColor: '#FF0000',
  },
  radioInner: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
  },
  dropdown: {
    height: 50,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 16,
  },
  ageContainer: {
    marginTop: 5,
  },
  radioGridRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingTop: 15,
    backgroundColor: '#F5F5F5',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  photoUploadButton: {
    marginTop: 5,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#999',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#4B99FB',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default PetDonationModal;
