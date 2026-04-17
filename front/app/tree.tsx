import React, { useState, useEffect } from 'react';
import { View, Dimensions, TouchableOpacity, Modal, Text as RNText, StyleSheet, ActivityIndicator, Alert} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Line, Rect, Text, G } from 'react-native-svg';
import dagre from 'dagre';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRoleFromToken } from '../service/auth';

// --- TYPES ---
type NodeData = {
  id: string;
  label: string;
  data: {
    firstName: string;
    lastName: string;
    sexe: string;
    profession: string;
    birthDate?: string;
    deathDate?: string;
    biography?: string;
  };
};

type EdgeData = {
  source: string;
  target: string;
  type: string; 
  biologique?: boolean; 
  statut?: string;    
};

type LienDetail = {
  type: string;
  sourceLabel?: string;
  targetLabel?: string;
};

export default function Tree() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  
  // Modals
  const [membreSelectionne, setMembreSelectionne] = useState<NodeData | null>(null);
  const [lienSelectionne, setLienSelectionne] = useState<LienDetail | null>(null);

  const NODE_WIDTH = 120;
  const NODE_HEIGHT = 60;

  // --- ANIMATIONS (ZOOM & PAN) ---
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const lastScale = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      lastX.value = translateX.value;
      lastY.value = translateY.value;
    })
    .onUpdate(e => {
      translateX.value = lastX.value + e.translationX;
      translateY.value = lastY.value + e.translationY;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => { lastScale.value = scale.value; })
    .onUpdate(e => { scale.value = lastScale.value * e.scale; });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // --- DATA FETCHING ---
  const fetchGraphData = async () => {
    try {
      const userRole = await getRoleFromToken();
      setRole(userRole);
      if (!userRole || userRole === 'wait') {
        router.replace('/wait');
        return;
      }
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/graph', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success === "true") {
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    } catch (error) {
      console.error("Erreur fetch graph:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGraphData(); }, []);

  // --- CONFIGURATION DAGRE ---
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(n => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // On ne fait passer par dagre que les relations parent-enfant pour la structure
  edges.filter(e => e.type !== 'couple').forEach(e => {
    g.setEdge(e.source, e.target);
  });

  dagre.layout(g);

  const { width, height } = Dimensions.get('window');

// Fonction pour supprimer un membre
const handleDeleteMember = (id: string, name: string) => {
  Alert.alert(
    "Supprimer un membre",
    `Voulez-vous vraiment supprimer ${name} ? Cela supprimera aussi tous ses liens de parenté.`,
    [
      { text: "Annuler", style: "cancel" },
      { 
        text: "Supprimer", 
        style: "destructive", 
        onPress: async () => {
          const token = await AsyncStorage.getItem('token');
          try {
            await fetch(`http://localhost:3000/members/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchGraphData(); // On recharge les données pour mettre à jour l'arbre
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer le membre");
          }
        } 
      }
    ]
  );
};

// Fonction pour supprimer une relation
const handleDeleteEdge = (sourceId: string, targetId: string) => {
  Alert.alert(
    "Supprimer la relation",
    "Voulez-vous supprimer ce lien ?",
    [
      { text: "Annuler", style: "cancel" },
      { 
        text: "Supprimer", 
        style: "destructive", 
        onPress: async () => {
          const token = await AsyncStorage.getItem('token');
          try {
            // Attention : adapte l'URL selon ton API (soit un ID de relation, soit source/target)
            await fetch(`http://localhost:3000/relationships/${sourceId}/${targetId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchGraphData();
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer le lien");
          }
        } 
      }
    ]
  );
};


  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f6fa' }}>
      <View style={styles.header}>
        <RNText style={styles.welcomeTitle}>Genoa - Arbre Généalogique</RNText>
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Svg width={width * 2} height={height * 2}>
            {/* 1. Rendu des liens PARENT-ENFANT (Dagre) */}
              {g.edges().map((e, i) => {
                const edge = g.edge(e);
                const originalEdge = edges.find(ed => ed.source === e.v && ed.target === e.w);
                return (
                  <Line
                    key={`edge-${i}`}
                    x1={edge.points[0].x}
                    y1={edge.points[0].y}
                    x2={edge.points[edge.points.length - 1].x}
                    y2={edge.points[edge.points.length - 1].y}
                    stroke={originalEdge?.biologique === false ? "#e67e22" : "#bdc3c7"}
                    strokeWidth={originalEdge?.biologique === false ? 3 : 2}
                    onLongPress={() => handleDeleteEdge(e.v, e.w)}
                    {...({
                      onContextMenu: (event: any) => {
                        event.preventDefault();
                        handleDeleteEdge(e.v, e.w);
                      }
                    } as any)}
                  />
                );
              })}

            {/* 2. Rendu des liens de COUPLE */}
              {edges.filter(e => e.type === 'couple').map((couple, i) => {
                const node1 = g.node(couple.source);
                const node2 = g.node(couple.target);
                if (!node1 || !node2) return null;
                return (
                  <G 
                    key={`couple-${i}`} 
                    onPress={() => setLienSelectionne({
                      type: 'couple',
                      sourceLabel: nodes.find(n => n.id === couple.source)?.label,
                      targetLabel: nodes.find(n => n.id === couple.target)?.label,
                    })}
                    onLongPress={() => handleDeleteEdge(couple.source, couple.target)}
                    {...({
                      onContextMenu: (event: any) => {
                        event.preventDefault();
                        handleDeleteEdge(couple.source, couple.target);
                      }
                    } as any)}
                  >
                  <Line
                    x1={node1.x + NODE_WIDTH / 4}
                    y1={node1.y}
                    x2={node2.x - NODE_WIDTH / 4}
                    y2={node2.y}
                    stroke={couple.statut === 'divorce' ? 'red' : 'gold'}
                    strokeWidth={4}
                  />
                  </G>
                );
              })}

            {/* 3. Rendu des MEMBRES (Nodes) */}
              {g.nodes().map(id => {
                const node = g.node(id);
                const originalData = nodes.find(n => n.id === id);
              return (
                <G 
                  key={id} 
                  onPress={() => originalData && setMembreSelectionne(originalData)}
                  onLongPress={() => originalData && handleDeleteMember(id, originalData.label)}
                  {...({
                    onContextMenu: (event: any) => {
                      event.preventDefault();
                      if (originalData) handleDeleteMember(id, originalData.label);
                    }
                  } as any)}
                >
                <Rect
                  x={node.x - NODE_WIDTH / 2}
                  y={node.y - NODE_HEIGHT / 2}
                  width={NODE_WIDTH} 
                  height={NODE_HEIGHT}
                  fill="white"
                  stroke={originalData?.data.sexe === 'F' ? '#e84393' : '#0984e3'}
                  strokeWidth={2} 
                  rx={10}
                />
                  <Text 
                    x={node.x} 
                    y={node.y + 5} 
                    textAnchor="middle" 
                    fontSize={12} 
                    fontWeight="bold" 
                    fill="#2d3436"
                    >
                    {originalData?.label}
                  </Text>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </GestureDetector>

      {/* FOOTER ACTIONS */}
      <View style={styles.footer}>
        {(role === 'admin' || role === 'writer') && (
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/editTree')}>
            <RNText style={styles.actionButtonText}>✏️ Modifier</RNText>
          </TouchableOpacity>
        )}
        {role === 'admin' && (
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e74c3c' }]} onPress={() => router.push('/admin')}>
            <RNText style={styles.actionButtonText}>⚙️ Admin</RNText>
          </TouchableOpacity>
        )}
      </View>

      {/* MODAL : FICHE MEMBRE */}
      <Modal visible={membreSelectionne !== null} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      {/* Titre : Prénom et Nom */}
      <RNText style={styles.modalTitle}>
        {membreSelectionne?.data.firstName} {membreSelectionne?.data.lastName}
      </RNText>
      
      {/* Ligne Sexe */}
      <View style={styles.infoRow}>
         <RNText style={styles.infoLabel}>Sexe : </RNText>
        <RNText>{membreSelectionne?.data.sexe === 'M' ? 'Homme ♂️' : 'Femme ♀️'}</RNText>      </View>

      {/* Ligne Profession */}
      <View style={styles.infoRow}>
         <RNText style={styles.infoLabel}>Profession : </RNText>
         <RNText>{membreSelectionne?.data.profession || 'Non renseignée'}</RNText>
      </View>

      {/* Ligne Naissance */}
      <View style={styles.infoRow}>
         <RNText style={styles.infoLabel}>Naissance : </RNText>
         <RNText>{membreSelectionne?.data.birthDate || 'Inconnue'}</RNText>
      </View>

      {/* Ligne Décès (ne s'affiche que si remplie) */}
      {membreSelectionne?.data.deathDate && (
        <View style={styles.infoRow}>
          <RNText style={styles.infoLabel}>Décès : </RNText>
          <RNText>{membreSelectionne.data.deathDate}</RNText>
        </View>
      )}

      {/* Bloc Biographie */}
      <RNText style={[styles.infoLabel, { marginTop: 10 }]}>Biographie :</RNText>
      <View style={styles.bioContainer}>
        <RNText style={styles.bioText}>
          {membreSelectionne?.data.biography || "Aucune description disponible."}
        </RNText>
      </View>

      {/* Bouton Fermer */}
      <TouchableOpacity 
        onPress={() => setMembreSelectionne(null)} 
        style={styles.closeButton}
      >
        <RNText style={{ color: 'white', fontWeight: 'bold' }}>Fermer</RNText>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      {/* MODAL : DÉTAILS LIEN */}
      <Modal visible={lienSelectionne !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>Relation de Couple</RNText>
            <RNText>{lienSelectionne?.sourceLabel} ❤️ {lienSelectionne?.targetLabel}</RNText>
            <TouchableOpacity onPress={() => setLienSelectionne(null)} style={[styles.closeButton, {backgroundColor: 'gold'}]}>
              <RNText>OK</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 50, paddingBottom: 20, backgroundColor: 'white', alignItems: 'center', elevation: 4 },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', color: '#2d3436' },
  footer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderColor: '#dfe6e9' },
  actionButton: { backgroundColor: '#3498db', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    backgroundColor: 'rgba(0,0,0,0.6)' 
  },
  modalContent: { 
    backgroundColor: 'white', 
    padding: 25, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    minHeight: 300 
  },
  modalTitle: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    marginBottom: 20, 
    color: '#2d3436' 
  },
  infoRow: { 
    flexDirection: 'row', 
    marginBottom: 12,
    alignItems: 'center'
  },
  infoLabel: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#636e72' 
  },
  bioContainer: {
    marginTop: 8,
    padding: 15,
    backgroundColor: '#f1f2f6',
    borderRadius: 12,
  },
  bioText: { 
    fontSize: 15,
    color: '#2d3436', 
    fontStyle: 'italic',
    lineHeight: 22
  },
  closeButton: { 
    marginTop: 25, 
    backgroundColor: '#3498db', 
    padding: 16, 
    borderRadius: 15, 
    alignItems: 'center' 
  }
});