// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ScrollView,
//   Modal,
//   Platform,
//   Image,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import {
//   getDoencasDeficiencias,
//   getEspecies,
//   getRacas,
//   getFaixaEtaria,
//   getUsuarioById,
//   postPet,
// } from '../../services/api';

// // Types
// interface PetDonationModalProps {
//   visible: boolean;
//   onClose: () => void;
//   userId: number; // ID do usuário atual para buscar suas informações
// }

// // Interfaces para os dados da API
// interface Especie {
//   id: number;
//   nome: string;
// }

// interface Raca {
//   id: number;
//   nome: string;
//   especie_id: number;
// }

// interface FaixaEtaria {
//   id: number;
//   nome: string;
//   idade_min: number;
//   idade_max: number;
//   unidade: string;
//   especie_id: number;
// }

// interface Doenca {
//   id: number;
//   nome: string;
// }

// interface Usuario {
//   id: number;
//   nome: string;
//   cidade_id: number;
// }

// // Estado do formulário
// interface FormData {
//   especie: string;
//   especie_id: number;
//   nome: string;
//   quantidade: string;
//   raca: string;
//   raca_id: number;
//   idadeCategoria: string;
//   faixa_etaria_id: number;
//   idade: string;
//   responsavel: string;
//   usuario_id: number;
//   estado: string;
//   cidade: string;
//   cidade_id: number;
//   sexo: string;
//   sexo_id: number;
//   possuiDoenca: string;
//   doencaDescricao: string;
//   doencas: string[]; // Lista de nomes de doenças
//   motivoDoacao: string;
//   foto: File | null;
//   status_id: number; // Status padrão "Em doação"
// }

// const PetDonationModal: React.FC<PetDonationModalProps> = ({ visible, onClose, userId }) => {
//   const router = useRouter();

//   // Estados para armazenar os dados da API
//   const [especies, setEspecies] = useState<Especie[]>([]);
//   const [racas, setRacas] = useState<Raca[]>([]);
//   const [faixasEtarias, setFaixasEtarias] = useState<FaixaEtaria[]>([]);
//   const [doencas, setDoencas] = useState<Doenca[]>([]);
//   const [usuarioAtual, setUsuarioAtual] = useState<Usuario | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);

//   // Estado inicial do formulário
//   const [formData, setFormData] = useState<FormData>({
//     especie: '',
//     especie_id: 0,
//     nome: '',
//     quantidade: '',
//     raca: '',
//     raca_id: 0,
//     idadeCategoria: '',
//     faixa_etaria_id: 0,
//     idade: '',
//     responsavel: '',
//     usuario_id: userId,
//     estado: '',
//     cidade: '',
//     cidade_id: 0,
//     sexo: '',
//     sexo_id: 1, // Valor padrão
//     possuiDoenca: '',
//     doencaDescricao: '',
//     doencas: [],
//     motivoDoacao: '',
//     foto: null,
//     status_id: 1, // Status "Em doação"
//   });

//   // Buscar dados ao carregar o modal
//   useEffect(() => {
//     if (visible) {
//       fetchInitialData();
//     }
//   }, [visible, userId]);

//   // Buscar dados quando a espécie é alterada (para atualizar raças)
//   useEffect(() => {
//     if (formData.especie_id) {
//       fetchRacasByEspecie(formData.especie_id);
//       fetchFaixaEtariaByEspecie(formData.especie_id);
//     }
//   }, [formData.especie_id]);

//   // Função para buscar todos os dados iniciais
//   const fetchInitialData = async () => {
//     setLoading(true);
//     try {
//       // Buscar espécies
//       const especiesData = await getEspecies();
//       setEspecies(especiesData);

//       // Buscar dados do usuário
//       if (userId) {
//         const userData = await getUsuarioById(userId);
//         if (userData) {
//           setUsuarioAtual(userData);
//           setFormData(prev => ({
//             ...prev,
//             responsavel: userData.nome,
//             usuario_id: userData.id,
//             cidade_id: userData.cidade_id,
//           }));
//         }
//       }

//       // Buscar doenças/deficiências
//       const doencasData = await getDoencasDeficiencias();
//       setDoencas(doencasData);

//     } catch (error) {
//       console.error("Erro ao carregar dados iniciais:", error);
//       Alert.alert("Erro", "Não foi possível carregar os dados iniciais.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Função para buscar raças com base na espécie selecionada
//   const fetchRacasByEspecie = async (especieId: number) => {
//     try {
//       const racasData = await getRacas(especieId);
//       setRacas(racasData);
//     } catch (error) {
//       console.error("Erro ao carregar raças:", error);
//     }
//   };

//   // Função para buscar faixas etárias com base na espécie selecionada
//   const fetchFaixaEtariaByEspecie = async (especieId: number) => {
//     try {
//       const faixasData = await getFaixaEtaria();
//       // Filtrar apenas faixas etárias relacionadas à espécie selecionada
//       const faixasFiltradas = faixasData.filter((faixa: FaixaEtaria) => 
//         faixa.especie_id === especieId || faixa.especie_id === 0
//       );
//       setFaixasEtarias(faixasFiltradas);
//     } catch (error) {
//       console.error("Erro ao carregar faixas etárias:", error);
//     }
//   };

//   // Função para atualizar o estado do formulário
//   const handleChange = (name: keyof FormData, value: any) => {
//     setFormData(prevState => {
//       // Caso especial para espécie: resetar raça e faixa etária
//       if (name === 'especie') {
//         // Encontrar o ID da espécie com base no nome selecionado
//         const especieObj = especies.find(esp => esp.nome === value);
//         const especieId = especieObj ? especieObj.id : 0;
        
//         return {
//           ...prevState,
//           [name]: value,
//           especie_id: especieId,
//           raca: '',
//           raca_id: 0,
//           idadeCategoria: '',
//           faixa_etaria_id: 0,
//         };
//       }
      
//       // Caso especial para raça
//       if (name === 'raca') {
//         // Encontrar o ID da raça com base no nome selecionado
//         const racaObj = racas.find(r => r.nome === value);
//         const racaId = racaObj ? racaObj.id : 0;
        
//         return {
//           ...prevState,
//           [name]: value,
//           raca_id: racaId,
//         };
//       }
      
//       // Caso especial para faixa etária
//       if (name === 'idadeCategoria') {
//         // Encontrar o ID da faixa etária com base no nome selecionado
//         const faixaObj = faixasEtarias.find(f => f.nome === value);
//         const faixaId = faixaObj ? faixaObj.id : 0;
        
//         return {
//           ...prevState,
//           [name]: value,
//           faixa_etaria_id: faixaId,
//         };
//       }
      
//       // Caso especial para doenças
//       if (name === 'possuiDoenca' && value === 'Não') {
//         return {
//           ...prevState,
//           [name]: value,
//           doencaDescricao: '',
//           doencas: [],
//         };
//       }

//       // Para todos os outros campos
//       return {
//         ...prevState,
//         [name]: value,
//       };
//     });
//   };

//   // Função para lidar com a seleção de doença
//   const handleDoencaSelect = (doencaNome: string) => {
//     if (formData.doencas.includes(doencaNome)) {
//       // Remover a doença se já estiver selecionada
//       setFormData(prev => ({
//         ...prev,
//         doencas: prev.doencas.filter(d => d !== doencaNome)
//       }));
//     } else {
//       // Adicionar a doença se não estiver selecionada
//       setFormData(prev => ({
//         ...prev,
//         doencas: [...prev.doencas, doencaNome]
//       }));
//     }
//   };

//   // Função para enviar o formulário
//   const handleSubmit = async () => {
//     // Validar campos obrigatórios
//     if (!formData.nome || !formData.quantidade || !formData.especie_id || !formData.raca_id || 
//         !formData.faixa_etaria_id || !formData.sexo_id || !formData.motivoDoacao) {
//       Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
//       return;
//     }

//     try {
//       // Preparar os dados para o envio usando o formato esperado pela API
//       const petPayload = {
//         nome: formData.nome,
//         especie_id: formData.especie_id,
//         raca_id: formData.raca_id,
//         idade: parseInt(formData.idade) || 0,
//         faixa_etaria_id: formData.faixa_etaria_id,
//         usuario_id: formData.usuario_id,
//         sexo_id: formData.sexo_id,
//         motivoDoacao: formData.motivoDoacao,
//         status_id: formData.status_id,
//         quantidade: parseInt(formData.quantidade) || 1,
//         doencas: formData.doencas,
//         foto: formData.foto
//       };

//       // Enviar os dados para a API
//       const result = await postPet(petPayload);
      
//       if (result) {
//         Alert.alert('Sucesso', 'Pet cadastrado com sucesso!');
//         resetForm();
//         onClose();
//         router.push('/pages/PetDonation');
//       } else {
//         Alert.alert('Erro', 'Não foi possível cadastrar o pet. Tente novamente.');
//       }
//     } catch (error) {
//       console.error('Erro ao cadastrar pet:', error);
//       Alert.alert('Erro', 'Ocorreu um erro ao cadastrar o pet. Tente novamente mais tarde.');
//     }
//   };

//   // Resetar o formulário
//   const resetForm = () => {
//     setFormData({
//       especie: '',
//       especie_id: 0,
//       nome: '',
//       quantidade: '',
//       raca: '',
//       raca_id: 0,
//       idadeCategoria: '',
//       faixa_etaria_id: 0,
//       idade: '',
//       responsavel: usuarioAtual?.nome || '',
//       usuario_id: userId,
//       estado: '',
//       cidade: '',
//       cidade_id: usuarioAtual?.cidade_id || 0,
//       sexo: '',
//       sexo_id: 1,
//       possuiDoenca: '',
//       doencaDescricao: '',
//       doencas: [],
//       motivoDoacao: '',
//       foto: null,
//       status_id: 1,
//     });
//   };

//   // Componente RadioButton personalizado
//   const RadioButton: React.FC<{
//     selected: boolean;
//     onPress: () => void;
//     label: string;
//   }> = ({ selected, onPress, label }) => (
//     <TouchableOpacity style={styles.radioContainer} onPress={onPress}>
//       <View style={[styles.radioOuter, selected && styles.selectedRadioOuter]}>
//         {selected && <View style={styles.radioInner} />}
//       </View>
//       <Text style={styles.radioLabel}>{label}</Text>
//     </TouchableOpacity>
//   );

//   // Função para abrir seletor de espécies
//   const showEspeciesSelector = () => {
//     if (especies.length === 0) {
//       Alert.alert('Aviso', 'Carregando espécies...');
//       return;
//     }

//     // Criar uma lista de opções para o Alert.alert
//     const options = especies.map(especie => ({
//       text: especie.nome,
//       onPress: () => handleChange('especie', especie.nome)
//     }));

//     // Adicionar opção para cancelar
//     options.push({
//       text: 'Cancelar',
//       style: 'cancel'
//     });

//     // Mostrar o alerta com as opções
//     Alert.alert(
//       'Selecione a Espécie',
//       '',
//       options.map(option => ({
//         text: option.text,
//         onPress: option.onPress,
//         style: option.text === 'Cancelar' ? 'cancel' : undefined
//       }))
//     );
//   };

//   // Função para abrir seletor de raças
//   const showRacasSelector = () => {
//     if (!formData.especie_id) {
//       Alert.alert('Aviso', 'Selecione uma espécie primeiro.');
//       return;
//     }

//     if (racas.length === 0) {
//       Alert.alert('Aviso', 'Nenhuma raça disponível para esta espécie.');
//       return;
//     }

//     // Criar uma lista de opções para o Alert.alert
//     const options = racas.map(raca => ({
//       text: raca.nome,
//       onPress: () => handleChange('raca', raca.nome)
//     }));

//     // Adicionar opção para cancelar
//     options.push({
//       text: 'Cancelar',
//       style: 'cancel'
//     });

//     // Mostrar o alerta com as opções
//     Alert.alert(
//       'Selecione a Raça',
//       '',
//       options.map(option => ({
//         text: option.text,
//         onPress: option.onPress,
//         style: option.text === 'Cancelar' ? 'cancel' : undefined
//       }))
//     );
//   };

//   // Função para abrir seletor de faixa etária
//   const showFaixaEtariaSelector = () => {
//     if (!formData.especie_id) {
//       Alert.alert('Aviso', 'Selecione uma espécie primeiro.');
//       return;
//     }

//     if (faixasEtarias.length === 0) {
//       Alert.alert('Aviso', 'Nenhuma faixa etária disponível para esta espécie.');
//       return;
//     }

//     // Mostrar opções de faixa etária através dos RadioButtons já existentes
//     // (Isso já é feito diretamente no formulário)
//   };

//   // Função para abrir seletor de doenças
//   const showDoencasSelector = () => {
//     if (doencas.length === 0) {
//       Alert.alert('Aviso', 'Carregando lista de doenças/deficiências...');
//       return;
//     }

//     // Criar uma lista de opções para o Alert.alert
//     const options = doencas.map(doenca => ({
//       text: doenca.nome,
//       onPress: () => handleDoencaSelect(doenca.nome)
//     }));

//     // Adicionar opção para cancelar
//     options.push({
//       text: 'Concluir',
//       style: 'cancel'
//     });

//     // Mostrar o alerta com as opções
//     Alert.alert(
//       'Selecione as Doenças/Deficiências',
//       'Você pode selecionar múltiplas opções.',
//       options.map(option => ({
//         text: option.text,
//         onPress: option.onPress,
//         style: option.text === 'Concluir' ? 'cancel' : undefined
//       }))
//     );
//   };

//   // Se estiver carregando, mostrar indicador de carregamento
//   if (loading && visible) {
//     return (
//       <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#4B99FB" />
//           <Text style={styles.loadingText}>Carregando...</Text>
//         </View>
//       </Modal>
//     );
//   }

//   return (
//     <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
//       <View style={styles.modalContainer}>
//         <View style={styles.modalContent}>
//           {/* Cabeçalho do Modal */}
//           <View style={styles.formHeader}>
//             <Text style={styles.formTitle}>Dados Do Pet</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Image source={require('../../assets/images/Icone/close-icon.png')} style={styles.closeIcon} />
//             </TouchableOpacity>
//           </View>

//           {/* Formulário em ScrollView */}
//           <ScrollView style={styles.formContainer}>
//             {/* Espécie */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Especie <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.radioRow}>
//                 {especies.map((especie) => (
//                   <RadioButton
//                     key={especie.id}
//                     selected={formData.especie === especie.nome}
//                     onPress={() => handleChange('especie', especie.nome)}
//                     label={especie.nome}
//                   />
//                 ))}
//               </View>
//             </View>

//             {/* Nome */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Nome <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Nome"
//                 value={formData.nome}
//                 onChangeText={(value) => handleChange('nome', value)}
//               />
//             </View>

//             {/* Quantidade */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Quantidade <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Quantidade"
//                 keyboardType="numeric"
//                 value={formData.quantidade}
//                 onChangeText={(value) => handleChange('quantidade', value)}
//               />
//             </View>

//             {/* Raça */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Raça <Text style={styles.required}>*</Text>
//               </Text>
//               <TouchableOpacity
//                 style={styles.dropdown}
//                 onPress={showRacasSelector}
//                 disabled={!formData.especie_id}
//               >
//                 <Text style={styles.dropdownText}>{formData.raca || 'Selecione uma raça'}</Text>
//                 <Text style={styles.dropdownIcon}>▼</Text>
//               </TouchableOpacity>
//             </View>

//             {/* Idade */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Faixa Etária <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.radioGridRow}>
//                 {faixasEtarias.map((faixa) => (
//                   <RadioButton
//                     key={faixa.id}
//                     selected={formData.idadeCategoria === faixa.nome}
//                     onPress={() => handleChange('idadeCategoria', faixa.nome)}
//                     label={faixa.nome}
//                   />
//                 ))}
//               </View>
//               <Text style={styles.label}>
//                 Idade <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Idade em meses ou anos"
//                 keyboardType="numeric"
//                 value={formData.idade}
//                 onChangeText={(value) => handleChange('idade', value)}
//               />
//             </View>

//             {/* Responsável */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Responsável <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.input}
//                 placeholder="Responsável"
//                 value={formData.responsavel}
//                 editable={false} // Campo não editável, usa o nome do usuário logado
//               />
//             </View>

//             {/* Sexo */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Sexo <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.radioRow}>
//                 <RadioButton
//                   selected={formData.sexo === 'Macho'}
//                   onPress={() => handleChange('sexo', 'Macho')}
//                   label="Macho"
//                 />
//                 <RadioButton
//                   selected={formData.sexo === 'Femea'}
//                   onPress={() => handleChange('sexo', 'Femea')}
//                   label="Femea"
//                 />
//               </View>
//             </View>

//             {/* Doença/Deficiência */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Possui Doença/Deficiência <Text style={styles.required}>*</Text>
//               </Text>
//               <View style={styles.radioRow}>
//                 <RadioButton
//                   selected={formData.possuiDoenca === 'Sim'}
//                   onPress={() => handleChange('possuiDoenca', 'Sim')}
//                   label="Sim"
//                 />
//                 <RadioButton
//                   selected={formData.possuiDoenca === 'Não'}
//                   onPress={() => handleChange('possuiDoenca', 'Não')}
//                   label="Não"
//                 />
//               </View>
//             </View>

//             {/* Descrição Doença - Mostrar apenas se possuiDoenca for "Sim" */}
//             {formData.possuiDoenca === 'Sim' && (
//               <View style={styles.fieldContainer}>
//                 <Text style={styles.label}>Se sim, selecione qual(is) seria(m)</Text>
//                 <TouchableOpacity
//                   style={styles.dropdown}
//                   onPress={showDoencasSelector}
//                 >
//                   <Text style={styles.dropdownText}>
//                     {formData.doencas.length > 0 
//                       ? `${formData.doencas.length} doença(s) selecionada(s)` 
//                       : 'Selecione as doenças/deficiências'}
//                   </Text>
//                   <Text style={styles.dropdownIcon}>▼</Text>
//                 </TouchableOpacity>
//                 {formData.doencas.length > 0 && (
//                   <View style={styles.selectedDoencas}>
//                     {formData.doencas.map((doenca, index) => (
//                       <Text key={index} style={styles.doencaTag}>{doenca}</Text>
//                     ))}
//                   </View>
//                 )}
//               </View>
//             )}

//             {/* Motivo da Doação */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Motivo de estar em Doação <Text style={styles.required}>*</Text>
//               </Text>
//               <TextInput
//                 style={styles.textArea}
//                 placeholder="Motivo de estar em Doação"
//                 multiline
//                 numberOfLines={4}
//                 value={formData.motivoDoacao}
//                 onChangeText={(value) => handleChange('motivoDoacao', value)}
//               />
//             </View>

//             {/* Foto */}
//             <View style={styles.fieldContainer}>
//               <Text style={styles.label}>
//                 Foto <Text style={styles.required}>*</Text>
//               </Text>
//               <TouchableOpacity
//                 style={styles.photoUploadButton}
//                 onPress={() =>
//                   Alert.alert('Upload de Foto', 'Funcionalidade de upload de foto será implementada futuramente.')
//                 }
//               >
//                 <View style={styles.photoPlaceholder}>
//                   <Text style={styles.uploadText}>Selecionar foto</Text>
//                 </View>
//               </TouchableOpacity>
//             </View>

//             {/* Botão Salvar */}
//             <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
//               <Text style={styles.saveButtonText}>Salvar</Text>
//             </TouchableOpacity>
//           </ScrollView>
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#F0F0F0',
//   },
//   modalContent: {
//     flex: 1,
//   },
//   formHeader: {
//     backgroundColor: '#FFFFFF',
//     paddingVertical: 15,
//     paddingHorizontal: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#EEEEEE',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   formTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   closeIcon: {
//     width: 24,
//     height: 24,
//   },
//   formContainer: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//     padding: 15,
//   },
//   fieldContainer: {
//     marginBottom: 15,
//   },
//   label: {
//     fontSize: 16,
//     marginBottom: 8,
//     color: '#000',
//   },
//   required: {
//     color: 'red',
//   },
//   radioRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 10,
//   },
//   radioContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginRight: 15,
//     marginBottom: 5,
//   },
//   radioOuter: {
//     height: 24,
//     width: 24,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: '#ccc',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   selectedRadioOuter: {
//     borderColor: '#FF0000',
//   },
//   radioInner: {
//     height: 12,
//     width: 12,
//     borderRadius: 6,
//     backgroundColor: '#FF0000',
//   },
//   radioLabel: {
//     fontSize: 16,
//     marginLeft: 8,
//   },
//   input: {
//     height: 50,
//     borderWidth: 1,
//     borderColor: '#CCCCCC',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     backgroundColor: '#F5F5F5',
//     fontSize: 16,
//   },
//   dropdown: {
//     height: 50,
//     borderWidth: 1,
//     borderColor: '#CCCCCC',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     backgroundColor: '#F5F5F5',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   dropdownText: {
//     fontSize: 16,
//     color: '#999',
//   },
//   dropdownIcon: {
//     fontSize: 16,
//   },
//   radioGridRow: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginBottom: 10,
//   },
//   textArea: {
//     height: 100,
//     borderWidth: 1,
//     borderColor: '#CCCCCC',
//     borderRadius: 8,
//     paddingHorizontal: 15,
//     paddingTop: 15,
//     backgroundColor: '#F5F5F5',
//     fontSize: 16,
//     textAlignVertical: 'top',
//   },
//   photoUploadButton: {
//     marginTop: 5,
//   },
//   photoPlaceholder: {
//     width: 120,
//     height: 120,
//     borderWidth: 1,
//     borderColor: '#CCCCCC',
//     borderRadius: 8,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   uploadText: {
//     color: '#999',
//     fontSize: 14,
//   },
//   saveButton: {
//     backgroundColor: '#4B99FB',
//     borderRadius: 25,
//     paddingVertical: 15,
//     alignItems: 'center',
//     marginTop: 20,
//     marginBottom: 40,
//   },
//   saveButtonText: {
//     color: '#FFFFFF',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#FFFFFF',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#333',
//   },
//   selectedDoencas: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     marginTop: 10,
//   },
//   doencaTag: {
//     backgroundColor: '#E8F0FE',
//     paddingHorizontal: 10,
//     paddingVertical: 5,
//     borderRadius: 15,
//     marginRight: 5,
//     marginBottom: 5,
//     fontSize: 14,
//     color: '#4B99FB',
//   },
// });

// export default PetDonationModal;