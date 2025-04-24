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
import EstadoSelect from '../../components/estados/EstadoSelect';
import CidadeSelect from '../../components/cidades/CidadeSelect';
// import EstadoDropdown from '../../components/estados/EstadoDropdown';
// import CidadeDropdown from '../../components/cidades/CidadeDropdown';

import { debounce } from 'lodash';

export default function CadastroUsuario() {
  const [sexo, setSexo] = useState<string>(''); // Especificando tipo de string
  const [sexos, setSexos] = useState<string[]>([]); // Especificando que sexos é uma lista de strings

  const [estado, setEstado] = useState<string | null>(null); // Estado agora pode ser string ou null
  const [estados, setEstados] = useState<string[]>([]); // Especificando lista de estados como strings
  const [estadoSearch, setEstadoSearch] = useState<string>(''); // Estado de busca de estado

  const [cidade, setCidade] = useState<string>(''); // Cidade como string
  const [cidades, setCidades] = useState<{ nome: string }[]>([]); // Cidades como lista de objetos com a propriedade nome
  const [cidadeSearch, setCidadeSearch] = useState<string>(''); // Busca da cidade
  const [cidadesFiltradas, setCidadesFiltradas] = useState<{ nome: string }[]>([]); // Filtragem de cidades

  const [showEstados, setShowEstados] = useState<boolean>(false); // Controla visibilidade dos estados
  const [showCidades, setShowCidades] = useState<boolean>(false); // Controla visibilidade das cidades
  const [loadingCidades, setLoadingCidades] = useState<boolean>(false); // Controle de loading de cidades
  const [cidadesCarregadas, setCidadesCarregadas] = useState<boolean>(false); // Se as cidades estão carregadas

  // Cache para armazenar cidades por estado
  const cidadesCache = useRef<{ [key: string]: { nome: string }[] }>({}); // Cache com chave string para cidades

  // Função para carregar cidades com cache
  const carregarCidades = async (selectedEstado: string | null) => {
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

  const handleEstadoChange = async (selectedEstado: string) => {
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

  const handleCidadeSelect = (selectedCidade: { nome: string }) => {
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
    debounce((text: string) => {
      const normalize = (str: string) =>
        str
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase();

      if (!text.trim()) {
        setCidadesFiltradas(cidades);
        return;
      }

      const filtered = cidades.filter((item) => item && item.nome && normalize(item.nome).includes(normalize(text)));

      setCidadesFiltradas(filtered);
    }, 300),
    [cidades]
  );

  // Atualiza a busca de cidades
  const handleCidadeSearchChange = (text: string) => {
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

  const filterEstados = (item: string) => {
    if (!item) return false;
    const normalize = (text: string) =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    return normalize(item).includes(normalize(estadoSearch));
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
              <EstadoSelect
                estado={estado}
                estados={estados}
                onSelectEstado={handleEstadoChange}
                showEstados={showEstados}
                setShowEstados={setShowEstados}
                estadoSearch={estadoSearch}
                setEstadoSearch={setEstadoSearch}
              />
            </View>

            {/* Cidade */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Cidade <Text style={styles.required}>*</Text>
              </Text>
              <CidadeSelect
                cidade={cidade}
                cidades={cidades}
                cidadesFiltradas={cidadesFiltradas}
                cidadesCarregadas={cidadesCarregadas}
                loadingCidades={loadingCidades}
                showCidades={showCidades}
                setShowCidades={setShowCidades}
                cidadeSearch={cidadeSearch}
                onSelectCidade={handleCidadeSelect}
                onSearchCidade={handleCidadeSearchChange}
                toggleCidades={toggleCidades}
              />
            </View>

            {/* Outros campos do formulário... */}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
    width: '100%',
  },
  mainContent: {
    marginBottom: 20,
  },
  titleContainer: {
    marginBottom: 10,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#333',
  },
  required: {
    color: 'red',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 10,
    borderRadius: 5,
    marginTop: 5,
    backgroundColor: '#fff',
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
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: '#333',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
  },
  dropdown: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    flexDirection: 'row',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownIcon: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
    maxHeight: 200,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 5,
    paddingLeft: 10,
  },
  dropdownDisabled: {
    backgroundColor: '#eee',
    borderColor: '#aaa',
  },
});
