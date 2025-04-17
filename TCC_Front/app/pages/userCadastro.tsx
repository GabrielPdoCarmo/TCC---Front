import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { getEstados, getCidadesPorEstado, getSexoUsuario } from '../../services/api';

export default function CadastroUsuario() {
  const [sexo, setSexo] = useState('');
  const [sexos, setSexos] = useState([]);

  const [estado, setEstado] = useState(null);
  const [estados, setEstados] = useState([]);
  const [estadoSearch, setEstadoSearch] = useState(''); // Adicionando a variável de busca

  const [cidade, setCidade] = useState('');
  const [cidades, setCidades] = useState([]);
  const [cidadeSearch, setCidadeSearch] = useState(''); // Opcional: para também permitir busca de cidades

  const [showEstados, setShowEstados] = useState(false);
  const [showCidades, setShowCidades] = useState(false);

  const handleEstadoChange = async (selectedEstado) => {
    setEstado(selectedEstado);
    setShowEstados(false);
    setCidade(''); // Resetar cidade quando mudar o estado
    try {
      const cidadesData = await getCidadesPorEstado(selectedEstado);
      setCidades(cidadesData);
    } catch (error) {
      console.error('Erro ao carregar as cidades:', error);
    }
  };

  const handleCidadeSelect = (selectedCidade) => {
    setCidade(selectedCidade.nome);
    setShowCidades(false);
  };

  const toggleEstados = async () => {
    if (!showEstados && estados.length === 0) {
      try {
        const estadosData = await getEstados();
        console.log('Estados carregados:', estadosData);
        setEstados(estadosData);
      } catch (error) {
        console.error('Erro ao carregar os estados:', error);
      }
    }
    setShowEstados(!showEstados);
    if (showEstados) {
      setEstadoSearch(''); // Limpa a busca quando fechar o dropdown
    }
  };

  const toggleCidades = () => {
    setShowCidades(!showCidades);
    if (showCidades) {
      setCidadeSearch(''); // Opcional: limpar busca de cidades
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sexosData = await getSexoUsuario();
        setSexos(sexosData);
      } catch (error) {
        console.error('Erro ao carregar os sexos:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <ImageBackground source={require('../../assets/images/backgrounds/Fundo_01.png')} style={styles.backgroundImage}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.mainContent}>
            <View style={styles.titleContainer}>
              <Text style={styles.pageTitle}>Dados Pessoais</Text>
            </View>
          </View>

          <View style={styles.formContainer}>
            {/* Nome */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="Nome" />
            </View>

            {/* Sexo */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Sexo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.checkboxContainer}>
                {sexos.map((item, index) => (
                  <TouchableOpacity key={index} style={styles.checkboxWrapper} onPress={() => setSexo(item.descricao)}>
                    <View style={styles.checkboxCustom}>
                      {sexo === item.descricao && <View style={styles.checkboxInner} />}
                    </View>
                    <Text style={styles.checkboxLabel}>{item.descricao}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" />
            </View>

            {/* Telefone */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Telefone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="(00) 0000-0000" keyboardType="phone-pad" />
            </View>

            {/* CPF/CNPJ */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                CPF/CNPJ <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="000.000.000-00" keyboardType="numeric" />
            </View>

            {/* CEP */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CEP</Text>
              <TextInput style={styles.input} placeholder="00.000-000" keyboardType="numeric" />
            </View>

            {/* Estado */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Estado <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity style={styles.dropdown} onPress={toggleEstados}>
                <Text style={styles.dropdownText}>{estado || 'Selecione um estado'}</Text>
                <Text style={styles.dropdownIcon}>{showEstados ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showEstados && (
                <View style={styles.dropdownList}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar estado..."
                    value={estadoSearch}
                    onChangeText={setEstadoSearch}
                  />
                  <ScrollView style={{ maxHeight: 200 }}>
                    {estados
                      .filter((item) => item.toLowerCase().includes(estadoSearch.toLowerCase()))
                      .map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.dropdownItem}
                          onPress={() => handleEstadoChange(item)}
                        >
                          <Text style={styles.dropdownItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Cidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdown, !estado && { backgroundColor: '#ccc' }]}
                onPress={estado ? toggleCidades : null}
              >
                <Text style={styles.dropdownText}>{cidade || 'Selecione uma cidade'}</Text>
                <Text style={styles.dropdownIcon}>{showCidades ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showCidades && (
                <View style={styles.dropdownList}>
                  <ScrollView style={{ maxHeight: 200 }}>
                    {cidades.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => handleCidadeSelect(item)} // Seleciona cidade
                      >
                        <Text style={styles.dropdownItemText}>{item.nome}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="Senha" secureTextEntry />
            </View>

            {/* Confirmar Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Confirmar Senha <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="Confirmar Senha" secureTextEntry />
            </View>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Criar Perfil</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#4285F4',
  },
  container: {
    flex: 1,
  },
  mainContent: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
    marginTop: 25,
  },
  titleContainer: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    marginTop: 60,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  required: {
    color: 'red',
  },
  input: {
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 10,
  },
  checkboxCustom: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 12,
    height: 12,
    backgroundColor: '#000',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: '#E8E8E8',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
  },
  dropdownIcon: {
    fontSize: 14,
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 50,
    marginVertical: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    padding: 10,
    fontSize: 14,
  },
});
