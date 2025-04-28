// App.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Alert
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Types
type Species = 'Cachorro' | 'Gatos' | 'Aves' | 'Roedores';
type AgeGroup = 'Filhote' | 'Jovem' | 'Adultos' | 'Senior' | 'Idoso';
type Gender = 'Macho' | 'Femea';

interface PetData {
  species: Species;
  name: string;
  quantity: string;
  breed: string;
  age: string;
  ageGroup: AgeGroup[];
  responsiblePerson: string;
  state: string;
  city: string;
  gender: Gender;
  hasDisease: boolean;
  diseaseDescription: string;
  donationReason: string;
  photo: string | null;
}

const Tab = createBottomTabNavigator();

// Main App Component
export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName = '';
            
            if (route.name === 'Adoção') {
              iconName = 'paw-outline';
            } else if (route.name === 'Doação') {
              iconName = 'heart-outline';
            } else if (route.name === 'Perfil') {
              iconName = 'person-outline';
            }
            
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3498db',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Adoção" component={AdoptionScreen} />
        <Tab.Screen name="Doação" component={DonationScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// Adoption Screen
function AdoptionScreen() {
  return (
    <View style={styles.centeredContainer}>
      <Text>Tela de Adoção</Text>
    </View>
  );
}

// Donation Screen
function DonationScreen() {
  const [formData, setFormData] = useState<PetData>({
    species: 'Cachorro',
    name: '',
    quantity: '',
    breed: '',
    age: '',
    ageGroup: [],
    responsiblePerson: '',
    state: '',
    city: '',
    gender: 'Macho',
    hasDisease: false,
    diseaseDescription: '',
    donationReason: '',
    photo: null
  });

  const [selectedSpecies, setSelectedSpecies] = useState<Species>('Cachorro');
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<Set<AgeGroup>>(new Set());
  const [selectedGender, setSelectedGender] = useState<Gender>('Macho');
  const [hasDisease, setHasDisease] = useState<boolean>(false);

  const handleSpeciesSelection = (species: Species) => {
    setSelectedSpecies(species);
    setFormData({ ...formData, species });
  };

  const handleAgeGroupSelection = (ageGroup: AgeGroup) => {
    const newSelectedAgeGroups = new Set(selectedAgeGroups);
    if (newSelectedAgeGroups.has(ageGroup)) {
      newSelectedAgeGroups.delete(ageGroup);
    } else {
      newSelectedAgeGroups.add(ageGroup);
    }
    setSelectedAgeGroups(newSelectedAgeGroups);
    setFormData({ ...formData, ageGroup: Array.from(newSelectedAgeGroups) });
  };

  const handleGenderSelection = (gender: Gender) => {
    setSelectedGender(gender);
    setFormData({ ...formData, gender });
  };

  const handleDiseaseSelection = (value: boolean) => {
    setHasDisease(value);
    setFormData({ ...formData, hasDisease: value });
  };

  const handleSave = () => {
    // Validation could be added here
    console.log('Form data submitted:', formData);
    Alert.alert('Sucesso', 'Dados do pet salvos com sucesso!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Doação</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="settings-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
      
      <View style={styles.petIconsContainer}>
        <Ionicons name="md-dog" size={30} color="black" />
        <Ionicons name="md-cat" size={30} color="black" />
        <Ionicons name="md-paw" size={30} color="black" />
      </View>
      
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Image source={require('./assets/paw-print.png')} style={styles.logoImage} />
        </View>
      </View>
      
      <ScrollView style={styles.formContainer}>
        <View style={styles.formContent}>
          <Text style={styles.formTitle}>Dados Do Pet</Text>
          
          <Text style={styles.label}>Especie <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.radioButton, selectedSpecies === 'Cachorro' && styles.radioButtonSelected]} 
              onPress={() => handleSpeciesSelection('Cachorro')}
            >
              <View style={styles.radioButtonInner}>
                {selectedSpecies === 'Cachorro' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Cachorro</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, selectedSpecies === 'Gatos' && styles.radioButtonSelected]} 
              onPress={() => handleSpeciesSelection('Gatos')}
            >
              <View style={styles.radioButtonInner}>
                {selectedSpecies === 'Gatos' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Gatos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, selectedSpecies === 'Aves' && styles.radioButtonSelected]} 
              onPress={() => handleSpeciesSelection('Aves')}
            >
              <View style={styles.radioButtonInner}>
                {selectedSpecies === 'Aves' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Aves</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, selectedSpecies === 'Roedores' && styles.radioButtonSelected]} 
              onPress={() => handleSpeciesSelection('Roedores')}
            >
              <View style={styles.radioButtonInner}>
                {selectedSpecies === 'Roedores' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Roedores</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Nome <Text style={styles.required}>*</Text></Text>
          <TextInput 
            style={styles.input} 
            placeholder="Nome" 
            value={formData.name}
            onChangeText={(text) => setFormData({...formData, name: text})}
          />
          
          <Text style={styles.label}>Quantidade <Text style={styles.required}>*</Text></Text>
          <TextInput 
            style={styles.input} 
            placeholder="Quantidade" 
            keyboardType="numeric"
            value={formData.quantity}
            onChangeText={(text) => setFormData({...formData, quantity: text})}
          />
          
          <Text style={styles.label}>Raça <Text style={styles.required}>*</Text></Text>
          <View style={styles.selectContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Raça" 
              value={formData.breed}
              onChangeText={(text) => setFormData({...formData, breed: text})}
            />
            <Ionicons name="chevron-down" size={24} color="black" style={styles.selectIcon} />
          </View>
          
          <Text style={styles.label}>Idade <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.checkBox, selectedAgeGroups.has('Filhote') && styles.checkBoxSelected]} 
              onPress={() => handleAgeGroupSelection('Filhote')}
            >
              <View style={styles.checkBoxInner}>
                {selectedAgeGroups.has('Filhote') && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkBoxLabel}>Filhote</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.checkBox, selectedAgeGroups.has('Jovem') && styles.checkBoxSelected]} 
              onPress={() => handleAgeGroupSelection('Jovem')}
            >
              <View style={styles.checkBoxInner}>
                {selectedAgeGroups.has('Jovem') && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkBoxLabel}>Jovem</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.checkBox, selectedAgeGroups.has('Adultos') && styles.checkBoxSelected]} 
              onPress={() => handleAgeGroupSelection('Adultos')}
            >
              <View style={styles.checkBoxInner}>
                {selectedAgeGroups.has('Adultos') && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkBoxLabel}>Adultos</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.checkBox, selectedAgeGroups.has('Senior') && styles.checkBoxSelected]} 
              onPress={() => handleAgeGroupSelection('Senior')}
            >
              <View style={styles.checkBoxInner}>
                {selectedAgeGroups.has('Senior') && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkBoxLabel}>Senior</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.checkBox, selectedAgeGroups.has('Idoso') && styles.checkBoxSelected]} 
              onPress={() => handleAgeGroupSelection('Idoso')}
            >
              <View style={styles.checkBoxInner}>
                {selectedAgeGroups.has('Idoso') && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <Text style={styles.checkBoxLabel}>Idoso</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput 
            style={styles.input} 
            placeholder="Idade" 
            value={formData.age}
            onChangeText={(text) => setFormData({...formData, age: text})}
          />
          
          <Text style={styles.label}>Responsável <Text style={styles.required}>*</Text></Text>
          <TextInput 
            style={styles.input} 
            placeholder="Responsável - (Nome do Usuário)" 
            value={formData.responsiblePerson}
            onChangeText={(text) => setFormData({...formData, responsiblePerson: text})}
          />
          
          <Text style={styles.label}>Estado <Text style={styles.required}>*</Text></Text>
          <View style={styles.selectContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Estado - (Estado do Usuário)" 
              value={formData.state}
              onChangeText={(text) => setFormData({...formData, state: text})}
            />
            <Ionicons name="chevron-down" size={24} color="black" style={styles.selectIcon} />
          </View>
          
          <Text style={styles.label}>Cidade <Text style={styles.required}>*</Text></Text>
          <View style={styles.selectContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Cidade - (Cidade do Usuário)" 
              value={formData.city}
              onChangeText={(text) => setFormData({...formData, city: text})}
            />
            <Ionicons name="chevron-down" size={24} color="black" style={styles.selectIcon} />
          </View>
          
          <Text style={styles.label}>Sexo <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.radioButton, selectedGender === 'Macho' && styles.radioButtonSelected]} 
              onPress={() => handleGenderSelection('Macho')}
            >
              <View style={styles.radioButtonInner}>
                {selectedGender === 'Macho' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Macho</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, selectedGender === 'Femea' && styles.radioButtonSelected]} 
              onPress={() => handleGenderSelection('Femea')}
            >
              <View style={styles.radioButtonInner}>
                {selectedGender === 'Femea' && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Femea</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Possui Doença/Deficiência <Text style={styles.required}>*</Text></Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity 
              style={[styles.radioButton, hasDisease === true && styles.radioButtonSelected]} 
              onPress={() => handleDiseaseSelection(true)}
            >
              <View style={styles.radioButtonInner}>
                {hasDisease === true && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Sim</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioButton, hasDisease === false && styles.radioButtonSelected]} 
              onPress={() => handleDiseaseSelection(false)}
            >
              <View style={styles.radioButtonInner}>
                {hasDisease === false && <View style={styles.radioButtonDot} />}
              </View>
              <Text style={styles.radioButtonLabel}>Não</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.label}>Se sim, comente qual seria</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Doença/Deficiência" 
            value={formData.diseaseDescription}
            onChangeText={(text) => setFormData({...formData, diseaseDescription: text})}
          />
          
          <Text style={styles.label}>Motivo de estar em Doação <Text style={styles.required}>*</Text></Text>
          <TextInput 
            style={styles.textArea} 
            placeholder="Motivo de estar em Doação" 
            multiline={true}
            numberOfLines={4}
            value={formData.donationReason}
            onChangeText={(text) => setFormData({...formData, donationReason: text})}
          />
          
          <Text style={styles.label}>Foto <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity style={styles.photoUpload}>
            {formData.photo ? (
              <Image source={{ uri: formData.photo }} style={styles.uploadedPhoto} />
            ) : (
              <View style={styles.photoPlaceholder} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Profile Screen
function ProfileScreen() {
  return (
    <View style={styles.centeredContainer}>
      <Text>Tela de Perfil</Text>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5E89FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  headerIcons: {
    flexDirection: 'row',
    width: 80,
    justifyContent: 'space-between',
  },
  addButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  addButtonText: {
    fontSize: 30,
    color: 'black',
  },
  petIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  formContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  formContent: {
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  required: {
    color: 'red',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F0F0F0',
  },
  selectContainer: {
    position: 'relative', 
    marginBottom: 15,
  },
  selectIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  radioButtonInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  radioButtonSelected: {},
  radioButtonDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'red',
  },
  radioButtonLabel: {
    fontSize: 16,
  },
  checkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5,
  },
  checkBoxInner: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  checkBoxSelected: {},
  checkMark: {
    color: '#000',
    fontSize: 14,
  },
  checkBoxLabel: {
    fontSize: 16,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingTop: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#F0F0F0',
    textAlignVertical: 'top',
  },
  photoUpload: {
    width: 140,
    height: 120,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F0F0F0',
  },
  uploadedPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  saveButton: {
    backgroundColor: '#3498db',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});