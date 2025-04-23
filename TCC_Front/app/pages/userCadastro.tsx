import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getEstados, getCidadesPorEstado, getSexoUsuario } from '../../services/api';
import { debounce } from 'lodash';

export default function CadastroUsuario() {
  const [sexo, setSexo] = useState('');
  const [sexos, setSexos] = useState([]);

  const [estado, setEstado] = useState(null);
  const [estados, setEstados] = useState([]);
  const [estadoSearch, setEstadoSearch] = useState('');

  const [cidade, setCidade] = useState('');
  const [cidades, setCidades] = useState([]);
  const [cidadeSearch, setCidadeSearch] = useState('');
  const [cidadesFiltradas, setCidadesFiltradas] = useState([]);

  const [showEstados, setShowEstados] = useState(false);
  const [showCidades, setShowCidades] = useState(false);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [cidadesCarregadas, setCidadesCarregadas] = useState(false);
  
  // Cache para armazenar cidades por estado
  const cidadesCache = useRef({});

  // Função para carregar cidades com cache
  const carregarCidades = async (selectedEstado) => {
    if (!selectedEstado) return [];
    
    // Verifica se já existe no cache
    if (cidadesCache.current[selectedEstado]) {
      setCidadesCarregadas(true);
      return cidadesCache.current[selectedEstado];
    }
    
    setLoadingCidades(true);
    try {
      const cidadesData = await getCidadesPorEstado(selectedEstado);
      // Salva no cache
      cidadesCache.current[selectedEstado] = cidadesData || [];
      setCidadesCarregadas(true);
      return cidadesData || [];
    } catch (error) {
      console.error('Erro ao carregar as cidades:', error);
      return [];
    } finally {
      setLoadingCidades(false);
    }
  };

  const handleEstadoChange = async (selectedEstado) => {
    setEstado(selectedEstado);
    setShowEstados(false);
    setCidade('');
    setCidadesCarregadas(false);
    setLoadingCidades(true);
    
    // Inicia o carregamento de cidades em segundo plano
    const cidadesData = await carregarCidades(selectedEstado);
    setCidades(cidadesData);
    setCidadesFiltradas(cidadesData);
  };

  const handleCidadeSelect = (selectedCidade) => {
    if (selectedCidade && selectedCidade.nome) {
      setCidade(selectedCidade.nome);
    }
    setShowCidades(false);
  };

  const toggleEstados = async () => {
    if (!showEstados && estados.length === 0) {
      try {
        const estadosData = await getEstados();
        setEstados(estadosData || []);
      } catch (error) {
        console.error('Erro ao carregar os estados:', error);
        setEstados([]);
      }
    }
    setShowEstados(!showEstados);
    if (showEstados) setEstadoSearch('');
  };

  const toggleCidades = async () => {
    if (!estado) return;
    
    // Se ainda não temos cidades, carregamos elas
    if (cidades.length === 0) {
      if (!loadingCidades) {
        const cidadesData = await carregarCidades(estado);
        setCidades(cidadesData);
        setCidadesFiltradas(cidadesData);
      }
    }
    
    setShowCidades(!showCidades);
    if (!showCidades) setCidadeSearch('');
  };

  // Filtragem de cidades com debounce para melhor performance
  const debouncedCidadeSearch = useCallback(
    debounce((text) => {
      if (!text.trim()) {
        setCidadesFiltradas(cidades);
        return;
      }
      
      const filtered = cidades.filter(item => 
        item && item.nome && item.nome.toLowerCase().includes(text.toLowerCase())
      );
      setCidadesFiltradas(filtered);
    }, 300),
    [cidades]
  );

  // Atualiza a busca de cidades
  const handleCidadeSearchChange = (text) => {
    setCidadeSearch(text);
    debouncedCidadeSearch(text);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sexosData = await getSexoUsuario();
        setSexos(sexosData || []);
        
        // Pré-carrega os estados para melhorar a experiência
        const estadosData = await getEstados();
        setEstados(estadosData || []);
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
      }
    };
    fetchData();
  }, []);

  const filterEstados = (item) => {
    if (!item) return false;
    return item.toLowerCase().includes((estadoSearch || '').toLowerCase());
  };

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
            {/* Outros campos do formulário... */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nome <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="Nome" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Sexo <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.checkboxContainer}>
                {(sexos || []).map((item, index) => (
                  <TouchableOpacity key={index} style={styles.checkboxWrapper} onPress={() => setSexo(item)}>
                    <View style={styles.checkboxCustom}>{sexo === item && <View style={styles.checkboxInner} />}</View>
                    <Text style={styles.checkboxLabel}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                E-mail <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="E-mail" keyboardType="email-address" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Telefone <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="(00) 0000-0000" keyboardType="phone-pad" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                CPF/CNPJ <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="000.000.000-00" keyboardType="numeric" />
            </View>

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
                    {(estados || []).filter(filterEstados).map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.dropdownItem}
                        onPress={() => handleEstadoChange(item)}
                      >
                        <Text style={styles.dropdownItemText}>{item || ''}</Text>
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
                onPress={toggleCidades}
                disabled={!estado}
              >
                {loadingCidades && !showCidades ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                    <Text style={styles.dropdownText}>Carregando cidades...</Text>
                    <ActivityIndicator size="small" color="#000" style={{ marginLeft: 8 }} />
                  </View>
                ) : (
                  <>
                    <Text style={styles.dropdownText}>{cidade || 'Selecione uma cidade'}</Text>
                    <Text style={styles.dropdownIcon}>{showCidades ? '▲' : '▼'}</Text>
                  </>
                )}
              </TouchableOpacity>
              {showCidades && (
                <View style={styles.dropdownList}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Pesquisar cidade..."
                    value={cidadeSearch}
                    onChangeText={handleCidadeSearchChange}
                    autoFocus={true}
                  />
                  {loadingCidades ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#000" />
                      <Text style={styles.loadingText}>Carregando cidades...</Text>
                    </View>
                  ) : (
                    <ScrollView style={{ maxHeight: 200 }}>
                      {cidadesFiltradas.length > 0 ? (
                        cidadesFiltradas.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => handleCidadeSelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>{item?.nome || ''}</Text>
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.noResultsText}>
                          {cidadeSearch ? 'Nenhuma cidade encontrada' : 'Carregando...'}
                        </Text>
                      )}
                    </ScrollView>
                  )}
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Senha <Text style={styles.required}>*</Text>
              </Text>
              <TextInput style={styles.input} placeholder="Senha" secureTextEntry />
            </View>

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
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
  },
  noResultsText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
  },
});