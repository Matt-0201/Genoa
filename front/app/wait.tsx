import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';

export default function Pending() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function verifierStatut() {
    setLoading(true);
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:3000/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.role !== 'wait') {
        router.replace('/tree'); 
      }
    } catch (e) {
      console.log("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>⏳</Text>
      <Text style={styles.text}>Votre compte est en cours de validation par un administrateur.</Text>
      
      <TouchableOpacity style={styles.refreshBtn} onPress={verifierStatut} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Actualiser mon statut</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 20 },
  emoji: { fontSize: 60, marginBottom: 20 },
  text: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 30 },
  refreshBtn: { backgroundColor: '#2ecc71', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  btnText: { color: 'white', fontWeight: 'bold' }
});