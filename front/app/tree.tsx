import React, { useState, useEffect, useMemo } from 'react';
import { View, Dimensions, TouchableOpacity, Modal, Text as RNText, StyleSheet, ActivityIndicator } from 'react-native';
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
  id: string;
  source: string;
  target: string;
  type: string;
  biologique?: boolean;
  statut?: string;
};

type LienDetail = {
  relationId?: string;
  type: string;
  sourceId?: string;
  targetId?: string;
  sourceLabel?: string;
  targetLabel?: string;
  biologique?: boolean;
  statut?: string;
};

const NODE_WIDTH = 120;
const NODE_HEIGHT = 60;

export default function Tree() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [edges, setEdges] = useState<EdgeData[]>([]);
  const [membreSelectionne, setMembreSelectionne] = useState<NodeData | null>(null);
  const [lienSelectionne, setLienSelectionne] = useState<LienDetail | null>(null);

  // --- ANIMATIONS ---
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

  // --- FETCH ---
  const fetchGraphData = async () => {
    try {
      const userRole = await getRoleFromToken();
      setRole(userRole);

      if (!userRole) { router.replace('/'); return; }
      if (userRole === 'wait') { router.replace('/wait'); return; }

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

  // --- SUPPRESSION MEMBRE ---
  const handleDeleteMember = (id: string, name: string) => {
    const confirme = window.confirm(`Supprimer ${name} ? Cela supprimera aussi tous ses liens.`);
    if (!confirme) return;

    AsyncStorage.getItem('token').then(token => {
      fetch(`http://localhost:3000/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token ?? ''}` }
      })
        .then(() => fetchGraphData())
        .catch(() => window.alert("Impossible de supprimer le membre"));
    });
  };

  // --- SUPPRESSION LIEN ---
  const handleDeleteEdge = (relationId: string) => {
    const confirme = window.confirm("Supprimer ce lien ?");
    if (!confirme) return;

    AsyncStorage.getItem('token').then(token => {
      fetch(`http://localhost:3000/relationships/${relationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token ?? ''}` }
      })
        .then(res => res.json())
        .then(data => {
          console.log('Réponse suppression :', data);
          if (data.success === "true") {
            fetchGraphData();
          } else {
            window.alert("Erreur : " + data.message);
          }
        })
        .catch(() => window.alert("Impossible de supprimer le lien"));
    });
  };

  // --- DAGRE (synchronisé avec useMemo) ---
  const { g } = useMemo(() => {
    const graph = new dagre.graphlib.Graph();
    graph.setGraph({ rankdir: 'TB', nodesep: 60, ranksep: 80 });
    graph.setDefaultEdgeLabel(() => ({}));

    const knownIds = new Set(nodes.map(n => n.id));
    nodes.forEach(n => graph.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }));

    edges
      .filter(e => e.type !== 'couple')
      .filter(e => knownIds.has(e.source) && knownIds.has(e.target))
      .forEach(e => graph.setEdge(e.source, e.target));

    dagre.layout(graph);

    return { g: graph };
  }, [nodes, edges]);

  const { width, height } = Dimensions.get('window');

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#f5f6fa' }}>

      {/* HEADER */}
      <View style={styles.header}>
        <RNText style={styles.welcomeTitle}>Genoa - Arbre Généalogique</RNText>
      </View>

      {/* ARBRE */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Svg width={width * 2} height={height * 2}>

            {/* Liens parent-enfant */}
            {g.edges().map((e, i) => {
              const edge = g.edge(e);
              const originalEdge = edges.find(ed => ed.source === e.v && ed.target === e.w);
              if (!edge || !edge.points || edge.points.length < 2) return null;
              return (
                <G key={`edge-${i}`}>
                  <Line
                    x1={edge.points[0].x} y1={edge.points[0].y}
                    x2={edge.points[edge.points.length - 1].x} y2={edge.points[edge.points.length - 1].y}
                    stroke={originalEdge?.biologique === false ? "#e67e22" : "#bdc3c7"}
                    strokeWidth={2}
                  />
                  <Line
                    x1={edge.points[0].x} y1={edge.points[0].y}
                    x2={edge.points[edge.points.length - 1].x} y2={edge.points[edge.points.length - 1].y}
                    stroke="transparent"
                    strokeWidth={20}
                    onPress={() => setLienSelectionne({
                      type: 'parent',
                      relationId: originalEdge?.id,
                      sourceId: e.v,
                      targetId: e.w,
                      biologique: originalEdge?.biologique,
                    })}
                  />
                </G>
              );
            })}

            {/* Liens de couple */}
            {edges.filter(e => e.type === 'couple').map((couple, i) => {
              const node1 = g.node(couple.source);
              const node2 = g.node(couple.target);
              if (!node1 || !node2 || node1.x === undefined || node2.x === undefined) return null;
              return (
                <G key={`couple-${i}`}>
                  <Line
                    x1={node1.x + NODE_WIDTH / 4} y1={node1.y}
                    x2={node2.x - NODE_WIDTH / 4} y2={node2.y}
                    stroke={couple.statut === 'divorce' ? 'red' : 'gold'}
                    strokeWidth={4}
                  />
                  <Line
                    x1={node1.x + NODE_WIDTH / 4} y1={node1.y}
                    x2={node2.x - NODE_WIDTH / 4} y2={node2.y}
                    stroke="transparent"
                    strokeWidth={20}
                    onPress={() => setLienSelectionne({
                      type: 'couple',
                      relationId: couple.id,
                      sourceId: couple.source,
                      targetId: couple.target,
                      sourceLabel: nodes.find(n => n.id === couple.source)?.label,
                      targetLabel: nodes.find(n => n.id === couple.target)?.label,
                      statut: couple.statut,
                    })}
                  />
                </G>
              );
            })}

            {/* Noeuds membres */}
            {g.nodes().map(id => {
              const node = g.node(id);
              const originalData = nodes.find(n => n.id === id);
              if (!node || node.x === undefined) return null;
              return (
                <G key={id}>
                  <Rect
                    x={node.x - NODE_WIDTH / 2}
                    y={node.y - NODE_HEIGHT / 2}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    fill="white"
                    stroke={originalData?.data.sexe === 'F' ? '#e84393' : '#0984e3'}
                    strokeWidth={2}
                    rx={10}
                    onPress={() => originalData && setMembreSelectionne(originalData)}
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

      {/* FOOTER */}
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

      {/* MODAL MEMBRE */}
      <Modal visible={membreSelectionne !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>
              {membreSelectionne?.data.firstName} {membreSelectionne?.data.lastName}
            </RNText>

            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Sexe : </RNText>
              <RNText>{membreSelectionne?.data.sexe === 'M' ? 'Homme' : 'Femme'}</RNText>
            </View>

            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Profession : </RNText>
              <RNText>{membreSelectionne?.data.profession || 'Non renseignée'}</RNText>
            </View>

            <View style={styles.infoRow}>
              <RNText style={styles.infoLabel}>Naissance : </RNText>
              <RNText>{membreSelectionne?.data.birthDate || 'Inconnue'}</RNText>
            </View>

            {membreSelectionne?.data.deathDate && (
              <View style={styles.infoRow}>
                <RNText style={styles.infoLabel}>Décès : </RNText>
                <RNText>{membreSelectionne.data.deathDate}</RNText>
              </View>
            )}

            <RNText style={[styles.infoLabel, { marginTop: 10 }]}>Biographie :</RNText>
            <View style={styles.bioContainer}>
              <RNText style={styles.bioText}>
                {membreSelectionne?.data.biography || "Aucune description disponible."}
              </RNText>
            </View>

            {(role === 'admin' || role === 'writer') && (
              <TouchableOpacity
                onPress={() => {
                  if (membreSelectionne) {
                    handleDeleteMember(membreSelectionne.id, membreSelectionne.label);
                    setMembreSelectionne(null);
                  }
                }}
                style={[styles.closeButton, { backgroundColor: '#e74c3c', marginTop: 10 }]}
              >
                <RNText style={{ color: 'white', fontWeight: 'bold' }}>🗑️ Supprimer</RNText>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setMembreSelectionne(null)} style={styles.closeButton}>
              <RNText style={{ color: 'white', fontWeight: 'bold' }}>Fermer</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL LIEN */}
      <Modal visible={lienSelectionne !== null} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <RNText style={styles.modalTitle}>
              {lienSelectionne?.type === 'couple' ? 'Relation de couple' : 'Relation parent-enfant'}
            </RNText>

            {lienSelectionne?.type === 'couple' && (
              <>
                <RNText style={styles.infoLabel}>Personnes :</RNText>
                <RNText style={{ marginBottom: 8 }}>
                  {lienSelectionne.sourceLabel} — {lienSelectionne.targetLabel}
                </RNText>
                <RNText style={styles.infoLabel}>Statut :</RNText>
                <RNText style={{ marginBottom: 8 }}>
                  {lienSelectionne.statut === 'marie' ? 'Marié(e)s' :
                   lienSelectionne.statut === 'pacs' ? 'Pacsé(e)s' :
                   lienSelectionne.statut === 'divorce' ? 'Divorcé(e)s' :
                   'Non renseigné'}
                </RNText>
              </>
            )}

            {lienSelectionne?.type === 'parent' && (
              <>
                <RNText style={styles.infoLabel}>Type de lien :</RNText>
                <RNText style={{ marginBottom: 8 }}>
                  {lienSelectionne.biologique ? 'Biologique' : 'Adoption'}
                </RNText>
              </>
            )}

            {(role === 'admin' || role === 'writer') && (
              <TouchableOpacity
                onPress={() => {
                  if (lienSelectionne?.relationId) {
                    handleDeleteEdge(lienSelectionne.relationId);
                    setLienSelectionne(null);
                  }
                }}
                style={{ backgroundColor: '#e74c3c', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 }}
              >
                <RNText style={{ color: 'white', fontWeight: 'bold' }}>🗑️ Supprimer ce lien</RNText>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setLienSelectionne(null)} style={styles.closeButton}>
              <RNText style={{ color: 'white', fontWeight: 'bold' }}>Fermer</RNText>
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
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: 'white', padding: 25, borderTopLeftRadius: 30, borderTopRightRadius: 30, minHeight: 300 },
  modalTitle: { fontSize: 26, fontWeight: 'bold', marginBottom: 20, color: '#2d3436' },
  infoRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'center' },
  infoLabel: { fontWeight: 'bold', fontSize: 16, color: '#636e72' },
  bioContainer: { marginTop: 8, padding: 15, backgroundColor: '#f1f2f6', borderRadius: 12 },
  bioText: { fontSize: 15, color: '#2d3436', fontStyle: 'italic', lineHeight: 22 },
  closeButton: { marginTop: 10, backgroundColor: '#3498db', padding: 16, borderRadius: 15, alignItems: 'center' },
});