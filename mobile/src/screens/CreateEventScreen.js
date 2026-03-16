import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import * as Animatable from 'react-native-animatable';

export default function CreateEventScreen({ navigation }) {
  const { state } = useContext(AuthContext);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // États du formulaire
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [maxPeople, setMaxPeople] = useState('');
  const [price, setPrice] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const response = await api.get('/auth/verify');
      setUserRole(response.data.user.role);
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error);
      Alert.alert('Erreur', 'Impossible de vérifier vos permissions');
      navigation.goBack();
      return;
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = async (query) => {
    if (query.length < 2) {
      setLocations([]);
      setShowLocationDropdown(false);
      return;
    }

    try {
      const response = await api.get(`/localisations?search=${encodeURIComponent(query)}`);
      setLocations(response.data || []);
      setShowLocationDropdown(true);
    } catch (error) {
      console.error('Erreur lors de la recherche de localisations:', error);
      setLocations([]);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setLocationQuery(location);
    setShowLocationDropdown(false);
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Erreur', 'Le titre est requis');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Erreur', 'La description est requise');
      return false;
    }
    if (!selectedLocation) {
      Alert.alert('Erreur', 'La localisation est requise');
      return false;
    }
    if (!maxPeople || parseInt(maxPeople) < 1) {
      Alert.alert('Erreur', 'Le nombre maximum de participants doit être au moins 1');
      return false;
    }
    if (date <= new Date()) {
      Alert.alert('Erreur', 'La date doit être dans le futur');
      return false;
    }
    if (price && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif ou 0');
      return false;
    }
    return true;
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) return;

    setCreating(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        location_id: selectedLocation,
        max_people: parseInt(maxPeople),
        date: date.toISOString(),
        price: parseFloat(price) || 0,
      };

      const response = await api.post('/events', eventData);
      Alert.alert('Succès', 'Événement créé avec succès !', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur lors de la création de l\'événement';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Vérification des permissions...</Text>
      </SafeAreaView>
    );
  }

  if (userRole !== 'organisateur' && userRole !== 'admin') {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>Accès refusé</Text>
        <Text style={styles.errorSubtext}>
          Seuls les organisateurs peuvent créer des événements.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <Animatable.View animation="fadeIn" duration={800} style={styles.header}>
          <Text style={styles.title}>Créer un événement</Text>
          <Text style={styles.subtitle}>Partagez votre expérience</Text>
        </Animatable.View>

        <View style={styles.form}>
          <Animatable.View animation="fadeInDown" delay={100} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Titre de l'événement"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!creating}
              placeholderTextColor="#666"
            />
          </Animatable.View>

          <Animatable.View animation="fadeInDown" delay={200} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description détaillée de l'événement"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={500}
              editable={!creating}
              placeholderTextColor="#666"
            />
          </Animatable.View>

          <Animatable.View animation="fadeInDown" delay={300} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Date et heure *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
              disabled={creating}
            >
              <Text style={styles.dateButtonText}>
                {date.toLocaleDateString('fr-FR')} à {date.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </TouchableOpacity>
          </Animatable.View>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={onDateChange}
              minimumDate={new Date()}
              locale="fr-FR"
            />
          )}

          <Animatable.View animation="fadeInDown" delay={400} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Localisation *</Text>
            <View style={styles.locationContainer}>
              <TextInput
                style={styles.input}
                placeholder="Rechercher une ville..."
                value={locationQuery}
                onChangeText={(text) => {
                  setLocationQuery(text);
                  searchLocations(text);
                }}
                editable={!creating}
                placeholderTextColor="#666"
              />
              {showLocationDropdown && locations.length > 0 && (
                <ScrollView style={styles.dropdownList}>
                  {locations.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.dropdownItem}
                      onPress={() => handleLocationSelect(item)}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </Animatable.View>

          <Animatable.View animation="fadeInDown" delay={500} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Nombre maximum de participants *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 50"
              value={maxPeople}
              onChangeText={setMaxPeople}
              keyboardType="number-pad"
              maxLength={4}
              editable={!creating}
              placeholderTextColor="#666"
            />
          </Animatable.View>

          <Animatable.View animation="fadeInDown" delay={600} duration={800} style={styles.inputContainer}>
            <Text style={styles.label}>Prix (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0 (gratuit)"
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              maxLength={6}
              editable={!creating}
              placeholderTextColor="#666"
            />
          </Animatable.View>

          <Animatable.View animation="fadeInDown" delay={700} duration={800}>
            <TouchableOpacity
              style={[styles.createButton, creating && { opacity: 0.5 }]}
              onPress={handleCreateEvent}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.createButtonText}>Créer l'événement</Text>
              )}
            </TouchableOpacity>
          </Animatable.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 48,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#fff',
  },
  locationContainer: {
    position: 'relative',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(20, 20, 20, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  createButtonText: {
    fontSize: 18,
    color: '#000',
    letterSpacing: 2,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
