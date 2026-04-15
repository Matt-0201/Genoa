import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Line, Rect, Text, G } from 'react-native-svg';
import dagre from 'dagre';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

const membres = [
  { id: '1', nom: 'Dupont', prenom: 'Grand-père' },
  { id: '2', nom: 'Dupont', prenom: 'Grand-mère' },
  { id: '3', nom: 'Dupont', prenom: 'Papa' },
  { id: '4', nom: 'Martin', prenom: 'Maman' },
  { id: '5', nom: 'Dupont', prenom: 'Moi' },
];

const relations = [
  { parentId: '1', enfantId: '3' },
  { parentId: '2', enfantId: '3' },
  { parentId: '3', enfantId: '5' },
  { parentId: '4', enfantId: '5' },
];

const NODE_WIDTH = 100;
const NODE_HEIGHT = 50;

export default function Tree() {
  // Positions pour le déplacement
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Sauvegarder la position avant chaque geste
  const lastX = useSharedValue(0);
  const lastY = useSharedValue(0);
  const lastScale = useSharedValue(1);

  // Geste de déplacement (pan)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      lastX.value = translateX.value;
      lastY.value = translateY.value;
    })
    .onUpdate(e => {
      translateX.value = lastX.value + e.translationX;
      translateY.value = lastY.value + e.translationY;
    });

  // Geste de zoom (pinch)
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      lastScale.value = scale.value;
    })
    .onUpdate(e => {
      scale.value = lastScale.value * e.scale;
    });

  // Combiner les deux gestes
  const gesture = Gesture.Simultaneous(panGesture, pinchGesture);

  // Style animé
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Dagre
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
                <G key={id}>
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
                  <Text
                    x={node.x}
                    y={node.y - 5}
                    textAnchor="middle"
                    fontSize={12}
                    fontWeight="bold"
                  >
                    {membre?.prenom}
                  </Text>
                  <Text
                    x={node.x}
                    y={node.y + 12}
                    textAnchor="middle"
                    fontSize={11}
                  >
                    {membre?.nom}
                  </Text>
                </G>
              );
            })}

          </Svg>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}