// PetAdoptionScreen.tsx
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  SafeAreaView,
} from 'react-native';

function PetAdoptionScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground source={require('../../assets/images/backgrounds/Fundo_02.png')} style={styles.backgroundImage}>
        <View style={styles.searchBarContainer}>
          <Image source={require('../../assets/images/Icone/search-icon.png')} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Qual nome de pet você gostaria de bus..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.notificationButton}>
            <Image
              source={require('../../assets/images/Icone/notification-icon.png')}
              style={styles.notificationIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Image source={require('../../assets/images/Icone/settings-icon.png')} style={styles.settingsIcon} />
          </TouchableOpacity>
        </View>

        {/* Botões de filtro */}
        <View style={styles.filterContainer}>
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>Filtro Avançado</Text>
            <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.myPetsButton}>
            <Text style={styles.myPetsButtonText}>Meus Pets</Text>
            <Image source={require('../../assets/images/Icone/arrow-right.png')} style={styles.arrowIcon} />
          </TouchableOpacity>
        </View>

        {/* Aqui seria inserida a lista de pets que foi omitida conforme solicitado */}
        <View style={styles.petListContainer}>{/* Lista de pets omitida */}</View>

        {/* Barra de navegação inferior */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.push('/pages/PetDonation')} // substitua 'outraTela' pelo nome da sua tela
          >
            <Image source={require('../../assets/images/Icone/adoption-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Adoção</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../../assets/images/Icone/donation-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Pets</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Image source={require('../../assets/images/Icone/profile-icon.png')} style={styles.navIcon} />
            <Text style={styles.navText}>Perfil</Text>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4682B4',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
    marginTop: 10,
    height: 50,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  notificationButton: {
    marginHorizontal: 5,
  },
  notificationIcon: {
    width: 24,
    height: 24,
  },
  settingsButton: {
    marginLeft: 5,
  },
  settingsIcon: {
    width: 24,
    height: 24,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  filterButtonText: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  myPetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  myPetsButtonText: {
    marginRight: 5,
    fontWeight: 'bold',
  },
  arrowIcon: {
    width: 12,
    height: 12,
  },
  petListContainer: {
    flex: 1,
    // Espaço para os cards de pets que foram omitidos
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  navIcon: {
    width: 30,
    height: 30,
  },
  navText: {
    fontSize: 12,
    marginTop: 3,
  },
});

export default PetAdoptionScreen;
