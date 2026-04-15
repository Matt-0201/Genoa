import React, { useState } from 'react';
import { View, Dimensions, TouchableOpacity, Modal, Text as RNText } from 'react-native';
import Svg, { Line, Rect, Text, G} from 'react-native-svg';import dagre from 'dagre';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

const membres = [
  { id: '1', nom: 'Dupont', prenom: 'Grand-père', sexe: 'M', dateNaissance: '1940-05-12', dateDeces: '2010-03-01', profession: 'Agriculteur' },
  { id: '2', nom: 'Dupont', prenom: 'Grand-mère', sexe: 'F', dateNaissance: '1943-08-22', dateDeces: null, profession: 'Institutrice' },
  { id: '3', nom: 'Dupont', prenom: 'Papa', sexe: 'M', dateNaissance: '1968-11-30', dateDeces: null, profession: 'Ingénieur' },
  { id: '4', nom: 'Martin', prenom: 'Maman', sexe: 'F', dateNaissance: '1970-03-15', dateDeces: null, profession: 'Médecin' },
  { id: '5', nom: 'Dupont', prenom: 'Moi', sexe: 'M', dateNaissance: '1995-07-20', dateDeces: null, profession: 'Étudiant' },
];

// Relations parent/enfant
const relations = [
  { parentId: '1', enfantId: '3', biologique: true },
  { parentId: '2', enfantId: '3', biologique: true },
  { parentId: '3', enfantId: '5', biologique: true },
  { parentId: '4', enfantId: '5', biologique: true },
];

// Relations de couple
const couples = [
  { id: 'c1', membre1Id: '1', membre2Id: '2', statut: 'marie' },   // marié
  { id: 'c2', membre1Id: '3', membre2Id: '4', statut: 'pacs' },    // pacsé
];

const NODE_WIDTH = 100;
const NODE_HEIGHT = 50;

// Définition du type d'un membre
type Membre = {
  id: string;
  nom: string;
  prenom: string;
  sexe: string;
  dateNaissance: string;
  dateDeces: string | null;
  profession: string;
};

type Lien = {
  type: 'parentEnfant' | 'couple';
  biologique?: boolean;
  statut?: string;
  membre1?: Membre;
  membre2?: Membre;
};

function couleurCouple(statut: string) {
  switch (statut) {
    case 'marie':   return 'gold';
    case 'pacs':    return 'orange';
    case 'divorce': return 'red';
    default:        return 'gray';
  }
}

export default function Tree() {
  const [membreSelectionne, setMembreSelectionne] = useState<Membre | null>(null);
  const [lienSelectionne, setLienSelectionne] = useState<Lien | null>(null);

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
    .onStart(() => {
      lastScale.value = scale.value;
    })
    .onUpdate(e => {
      scale.value = lastScale.value * e.scale;
    });

  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 30 });
  g.setDefaultEdgeLabel(() => ({}));

  membres.forEach(m => {
    g.setNode(m.id, { label: m.prenom, width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  relations.forEach(r => {
    g.setEdge(r.parentId, r.enfantId);
  });

  dagre.layout(g);

  const { width, height } = Dimensions.get('window');

  return (
    <>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <Svg width={width} height={height}>

              {/* Liens */}
              {g.edges().map(e => {
                const edge = g.edge(e);
                return edge.points.slice(0, -1).map((pt, i) => (
                  <Line
                    key={`${e.v}-${e.w}-${i}`}
                    x1={pt.x} y1={pt.y}
                    x2={edge.points[i + 1].x} y2={edge.points[i + 1].y}
                    stroke="black"
                    strokeWidth={2}
                  />
                ));
              })}

              {/* Noeuds */}
              {g.nodes().map(id => {
                const node = g.node(id);
                const membre = membres.find(m => m.id === id);
                return (
                  <G key={id} onPress={() => membre && setMembreSelectionne(membre)}>
                    <Rect
                      x={node.x - NODE_WIDTH / 2}
                      y={node.y - NODE_HEIGHT / 2}
                      width={NODE_WIDTH}
                      height={NODE_HEIGHT}
                      fill="lightblue"
                      stroke="steelblue"
                      strokeWidth={2}
                      rx={8}
                    />
                    <Text x={node.x} y={node.y - 5} textAnchor="middle" fontSize={12} fontWeight="bold">
                      {membre?.prenom}
                    </Text>
                    <Text x={node.x} y={node.y + 12} textAnchor="middle" fontSize={11}>
                      {membre?.nom}
                    </Text>
                  </G>
                );
              })}

              {/* Liens de couple */}
              {couples.map(couple => {
                const node1 = g.node(couple.membre1Id);
                const node2 = g.node(couple.membre2Id);
                if (!node1 || !node2) return null;

                  const mx = (node1.x + node2.x) / 2; // point milieu X
                  const my = (node1.y + node2.y) / 2; // point milieu Y

                return (
                  <G key={couple.id} onPress={() => setLienSelectionne({
                    type: 'couple',
                    statut: couple.statut,
                    membre1: membres.find(m => m.id === couple.membre1Id),
                    membre2: membres.find(m => m.id === couple.membre2Id),
                  })}>
                  <Line
                  x1={node1.x + NODE_WIDTH / 2}
                  y1={node1.y}
                  x2={node2.x - NODE_WIDTH / 2}
                  y2={node2.y}
                  stroke={couleurCouple(couple.statut)}
                  strokeWidth={3}
                  />
              </G>
              );
            })}

            </Svg>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      {/* Fiche membre */}
      <Modal visible={membreSelectionne !== null} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <RNText style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>
              {membreSelectionne?.prenom} {membreSelectionne?.nom}
            </RNText>
            <RNText>Sexe : {membreSelectionne?.sexe ?? 'Non renseigné'}</RNText>
            <RNText>Naissance : {membreSelectionne?.dateNaissance ?? 'Non renseigné'}</RNText>
            <RNText>Décès : {membreSelectionne?.dateDeces ?? 'Non renseigné'}</RNText>
            <RNText>Profession : {membreSelectionne?.profession ?? 'Non renseigné'}</RNText>

            <TouchableOpacity
              onPress={() => setMembreSelectionne(null)}
              style={{ marginTop: 20, backgroundColor: 'steelblue', padding: 12, borderRadius: 8, alignItems: 'center' }}
            >
              <RNText style={{ color: 'white', fontWeight: 'bold' }}>Fermer</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={lienSelectionne !== null} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>

            {lienSelectionne?.type === 'couple' && (
          <>
            <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Relation de couple
            </RNText>
            <RNText>Membre 1 : {lienSelectionne.membre1?.prenom} {lienSelectionne.membre1?.nom}</RNText>
            <RNText>Membre 2 : {lienSelectionne.membre2?.prenom} {lienSelectionne.membre2?.nom}</RNText>
            <RNText>Statut : {lienSelectionne.statut}</RNText>
          </>
         )}  

          {lienSelectionne?.type === 'parentEnfant' && (
          <>
          <RNText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>
            Relation parent/enfant
          </RNText>
          <RNText>Lien : {lienSelectionne.biologique ? 'Biologique' : 'Adopté'}</RNText>
          </>
        )}

              <TouchableOpacity
                onPress={() => setLienSelectionne(null)}
                style={{ marginTop: 20, backgroundColor: 'steelblue', padding: 12, borderRadius: 8, alignItems: 'center' }}
              >
              <RNText style={{ color: 'white', fontWeight: 'bold' }}>Fermer</RNText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}