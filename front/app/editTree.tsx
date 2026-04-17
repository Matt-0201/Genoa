import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  Alert, ScrollView, ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour typer nos membres venant de l'API
interface Member {
  id: string;
  label: string;
  data: {
    firstName: string;
    lastName: string;
    sexe: string;
    birthDate?: string;
    deathDate?: string;
    profession?: string;
    biography?: string;
  };
}

export default function EditTree() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  
  // État pour savoir si on est en train de modifier quelqu'un
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Formulaire Membre
  const [memberForm, setMemberForm] = useState({
    firstName: '',
    lastName: '',
    sexe: 'M',
    birthDate: '',
    deathDate: '',
    profession: '',
    biography: ''
  });

  // Formulaire Relation
  const [relForm, setRelForm] = useState({
    sourceId: '',
    targetId: '',
    type: 'parent-enfant' as 'parent-enfant' | 'couple',
    biologique: true,
    statut: 'marie' as 'marie' | 'pacs' | 'divorce'
  });

  // 1. Charger les données au démarrage
  const loadData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://localhost:3000/graph', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success === "true") {
        setMembers(data.nodes);
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de charger les membres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // 2. Sauvegarder (Créer ou Modifier) un membre
  const handleSaveMember = async () => {
    if (!memberForm.firstName || !memberForm.lastName) {
      Alert.alert("Attention", "Le nom et le prénom sont obligatoires.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const isEditing = editingMemberId !== null;
      const url = isEditing 
        ? `http://localhost:3000/members/${editingMemberId}` 
        : 'http://localhost:3000/members';
      
      const res = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(memberForm)
      });

      const data = await res.json();
      if (data.success === "true") {
        Alert.alert("Succès", isEditing ? "Membre modifié !" : "Membre créé !");
        resetMemberForm();
        loadData();
      }
    } catch (err) {
      Alert.alert("Erreur", "Erreur lors de l'enregistrement");
    }
  };

  const resetMemberForm = () => {
    setEditingMemberId(null);
    setMemberForm({
      firstName: '', lastName: '', sexe: 'M',
      birthDate: '', deathDate: '', profession: '', biography: ''
    });
  };

  // 3. Créer une Relation
  const handleAddRelation = async () => {
    if (!relForm.sourceId || !relForm.targetId) {
      Alert.alert("Erreur", "Veuillez sélectionner deux personnes.");
      return;
    }
    if (relForm.sourceId === relForm.targetId) {
      Alert.alert("Erreur", "Une personne ne peut pas être en relation avec elle-même.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const res = await fetch('http://localhost:3000/relationships', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(relForm)
      });

      const data = await res.json();
      if (data.success === "true") {
        Alert.alert("Succès", "Relation enregistrée !");
        setRelForm({ ...relForm, sourceId: '', targetId: '' });
      }
    } catch (err) {
      Alert.alert("Erreur", "Impossible de créer la relation");
    }
  };

  if (loading && members.length === 0) return <ActivityIndicator style={{flex:1}} size="large"/>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 50}}>
      <Text style={styles.mainTitle}>Gestion de l'Arbre</Text>

      {/* --- SECTION MEMBRE --- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          {editingMemberId ? "✏️ Modifier le membre" : "👤 Ajouter un membre"}
        </Text>
        
        <TextInput placeholder="Prénom" style={styles.input} value={memberForm.firstName} onChangeText={(t) => setMemberForm({...memberForm, firstName: t})} />
        <TextInput placeholder="Nom" style={styles.input} value={memberForm.lastName} onChangeText={(t) => setMemberForm({...memberForm, lastName: t})} />
        <TextInput placeholder="Date de naissance (JJ/MM/AAAA)" style={styles.input} value={memberForm.birthDate} onChangeText={(t) => setMemberForm({...memberForm, birthDate: t})} />
        <TextInput placeholder="Date de décès (si applicable)" style={styles.input} value={memberForm.deathDate} onChangeText={(t) => setMemberForm({...memberForm, deathDate: t})} />
        <TextInput placeholder="Profession" style={styles.input} value={memberForm.profession} onChangeText={(t) => setMemberForm({...memberForm, profession: t})} />
        <TextInput placeholder="Biographie" multiline style={[styles.input, {height: 60}]} value={memberForm.biography} onChangeText={(t) => setMemberForm({...memberForm, biography: t})} />

        <Text style={styles.label}>Sexe :</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setMemberForm({...memberForm, sexe: 'M'})} style={[styles.choiceBtn, memberForm.sexe==='M' && styles.activeBtn]}><Text>Homme</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setMemberForm({...memberForm, sexe: 'F'})} style={[styles.choiceBtn, memberForm.sexe==='F' && styles.activeBtn]}><Text>Femme</Text></TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.btnSave} onPress={handleSaveMember}>
          <Text style={styles.btnText}>{editingMemberId ? "Mettre à jour" : "Enregistrer dans la base"}</Text>
        </TouchableOpacity>
        {editingMemberId && (
          <TouchableOpacity onPress={resetMemberForm} style={{marginTop: 10}}><Text style={{textAlign: 'center', color: 'red'}}>Annuler la modification</Text></TouchableOpacity>
        )}
      </View>

      {/* --- SECTION RELATION --- */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔗 Créer un lien</Text>
        
        <Text style={styles.label}>Type de relation :</Text>
        <View style={styles.row}>
          <TouchableOpacity onPress={() => setRelForm({...relForm, type: 'parent-enfant'})} style={[styles.choiceBtn, relForm.type==='parent-enfant' && styles.activeBtn]}><Text>Parent-Enfant</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setRelForm({...relForm, type: 'couple'})} style={[styles.choiceBtn, relForm.type==='couple' && styles.activeBtn]}><Text>Couple</Text></TouchableOpacity>
        </View>

        {relForm.type === 'parent-enfant' ? (
          <View style={styles.row}>
            <Text style={{marginRight: 10}}>Lien biologique ?</Text>
            <TouchableOpacity onPress={() => setRelForm({...relForm, biologique: true})} style={[styles.miniBtn, relForm.biologique && styles.activeBtn]}><Text>Oui</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setRelForm({...relForm, biologique: false})} style={[styles.miniBtn, !relForm.biologique && styles.activeBtn]}><Text>Non</Text></TouchableOpacity>
          </View>
        ) : (
          <View style={styles.row}>
            {['marie', 'pacs', 'divorce'].map(s => (
              <TouchableOpacity key={s} onPress={() => setRelForm({...relForm, statut: s as any})} style={[styles.miniBtn, relForm.statut===s && styles.activeBtn]}>
                <Text>{s.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.infoText}>
          Parent/Conjoint 1 : <Text style={{fontWeight: 'bold'}}>{members.find(m => m.id === relForm.sourceId)?.label || "---"}</Text>
        </Text>
        <Text style={styles.infoText}>
          Enfant/Conjoint 2 : <Text style={{fontWeight: 'bold'}}>{members.find(m => m.id === relForm.targetId)?.label || "---"}</Text>
        </Text>

        <View style={styles.memberList}>
          {members.map(m => (
            <View key={m.id} style={styles.memberItem}>
              <Text style={{flex: 1}}>{m.label}</Text>
              <TouchableOpacity onPress={() => setRelForm({...relForm, sourceId: m.id})} style={styles.selectBtn}><Text>1</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setRelForm({...relForm, targetId: m.id})} style={styles.selectBtn}><Text>2</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setEditingMemberId(m.id); setMemberForm(m.data as any); }} style={styles.editBtn}><Text>✏️</Text></TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btnBlue} onPress={handleAddRelation}>
          <Text style={styles.btnText}>Valider la Relation</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnBack} onPress={() => router.replace('/tree')}>
        <Text style={styles.btnText}>⬅ Retour à l'Arbre</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f6fa', padding: 15 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginTop: 40, marginBottom: 20 },
  card: { backgroundColor: 'white', padding: 20, borderRadius: 15, marginBottom: 20, elevation: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#2d3436' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 5, marginTop: 10 },
  input: { borderBottomWidth: 1, borderColor: '#dfe6e9', marginBottom: 15, padding: 8, fontSize: 16 },
  row: { flexDirection: 'row', marginBottom: 15 },
  choiceBtn: { flex: 1, padding: 10, backgroundColor: '#f1f2f6', alignItems: 'center', marginRight: 5, borderRadius: 8 },
  miniBtn: { padding: 8, backgroundColor: '#f1f2f6', marginRight: 5, borderRadius: 5, minWidth: 40, alignItems: 'center' },
  activeBtn: { backgroundColor: '#3498db' },
  btnSave: { backgroundColor: '#2ecc71', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  btnBlue: { backgroundColor: '#3498db', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 15 },
  btnBack: { backgroundColor: '#7f8c8d', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  memberList: { maxHeight: 250, borderWidth: 1, borderColor: '#eee', borderRadius: 10, marginVertical: 15 },
  memberItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#f1f2f6' },
  selectBtn: { backgroundColor: '#ecf0f1', padding: 8, marginLeft: 5, borderRadius: 5, width: 35, alignItems: 'center' },
  editBtn: { backgroundColor: '#ffeaa7', padding: 8, marginLeft: 10, borderRadius: 5 },
  infoText: { fontSize: 14, marginBottom: 5 }
});