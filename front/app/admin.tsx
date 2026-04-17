import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getRoleFromToken } from '../service/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Type utilisateur
type Utilisateur = {
  id: string;
  email: string;
  role: 'wait' | 'reader' | 'writer' | 'admin';
  tokenExpire: string; // date d'expiration du token
};


// Vérifie si le token est encore valide
function tokenActif(dateExpiration: string): boolean {
  return new Date(dateExpiration) > new Date();
}

// Couleur selon le rôle
function couleurRole(role: string) {
  switch (role) {
    case 'admin':  return '#e74c3c';
    case 'writer': return '#2ecc71';
    case 'reader': return '#3498db';
    case 'wait':   return '#f39c12';
    default:       return 'gray';
  }
}

export default function Admin() {
    const router = useRouter();


useEffect(() => {
  async function initialiserPage() {
    const role = await getRoleFromToken();
    
    // 1. Vérification de sécurité
    if (role !== 'admin') {
      router.replace('/tree');
      alert("Accès refusé");
      return;
    }

    // 2. Si admin, on charge les données
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/genoa', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      const usersFormates = data.users.map((u: any) => ({
        id: u._id,
        email: u.email,
        role: u.role,
        tokenExpire: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));
      setUtilisateurs(usersFormates);
    } catch (error) {
      console.error("Erreur de chargement", error);
    }
  }

  initialiserPage();
}, []);


const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
const [userSelectionne, setUserSelectionne] = useState<Utilisateur | null>(null);

  // Changer le rôle d'un utilisateur
  async function changerRole(id: string, nouveauRole: Utilisateur['role']) {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`http://localhost:3000/admin/users/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ role: nouveauRole })
  });

  if (response.ok) {
    // Mettre à jour localement seulement si le back a confirmé
    setUtilisateurs(prev =>
      prev.map(u => u.id === id ? { ...u, role: nouveauRole } : u)
    );
  } else {
    console.log('Erreur lors du changement de rôle');
  }
  setUserSelectionne(null);
}

  // Supprimer un utilisateur
  async function supprimerUser(id: string) {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`http://localhost:3000/admin/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (response.ok) {
    setUtilisateurs(prev => prev.filter(u => u.id !== id));
  } else {
    console.log('Erreur lors de la suppression');
  }
  setUserSelectionne(null);
}

  return (
    <View style={styles.container}>
      <Text style={styles.titre}>Administration</Text>
      <Text style={styles.sousTitre}>{utilisateurs.length} utilisateurs</Text>

      <FlatList
        data={utilisateurs}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.carte}
            onPress={() => setUserSelectionne(item)}
          >
            {/* Indicateur token actif/expiré */}
            <View style={[styles.indicateur, { backgroundColor: tokenActif(item.tokenExpire) ? '#2ecc71' : '#e74c3c' }]} />

            <View style={{ flex: 1 }}>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.tokenTexte}>
                Token : {tokenActif(item.tokenExpire) ? 'Actif' : 'Expiré'}
              </Text>
            </View>

            {/* Badge rôle */}
            <View style={[styles.badge, { backgroundColor: couleurRole(item.role) }]}>
              <Text style={styles.badgeTexte}>{item.role}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Modal actions sur un utilisateur */}
      <Modal visible={userSelectionne !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContenu}>
            <Text style={styles.modalTitre}>{userSelectionne?.email}</Text>
            <Text style={{ marginBottom: 16, color: 'gray' }}>
              Rôle actuel : {userSelectionne?.role}
            </Text>

            <Text style={styles.sectionTitre}>Changer le rôle :</Text>

            {(['wait', 'reader', 'writer', 'admin'] as Utilisateur['role'][]).map(role => (
              <TouchableOpacity
                key={role}
                style={[styles.boutonRole, { backgroundColor: couleurRole(role) }]}
                onPress={() => userSelectionne && changerRole(userSelectionne.id, role)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{role}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.boutonSupprimer}
              onPress={() => userSelectionne && supprimerUser(userSelectionne.id)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑️ Supprimer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.boutonFermer}
              onPress={() => setUserSelectionne(null)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  titre:         { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  sousTitre:     { color: 'gray', marginBottom: 16 },
  carte:         { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 10, elevation: 2 },
  indicateur:    { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  email:         { fontWeight: 'bold', fontSize: 15 },
  tokenTexte:    { fontSize: 12, color: 'gray', marginTop: 2 },
  badge:         { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeTexte:    { color: 'white', fontSize: 12, fontWeight: 'bold' },
  modalOverlay:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContenu:  { backgroundColor: 'white', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  modalTitre:    { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  sectionTitre:  { fontWeight: 'bold', marginBottom: 8 },
  boutonRole:    { padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  boutonSupprimer: { backgroundColor: '#e74c3c', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  boutonFermer:  { backgroundColor: 'steelblue', padding: 12, borderRadius: 8, alignItems: 'center' },
});