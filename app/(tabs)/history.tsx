import React from 'react';
import { FlatList, StyleSheet, Text, useColorScheme, View } from 'react-native';

const readings = [
  { id: '1', timestamp: '2025-06-10 14:00', pm25: 12, pm10: 20 },
  { id: '2', timestamp: '2025-06-10 13:00', pm25: 16, pm10: 25 },
  { id: '3', timestamp: '2025-06-10 12:00', pm25: 10, pm10: 18 },
];

export default function HistoryScreen() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const styles = getStyles(isDark);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Lecturas</Text>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.text}>Date: {item.timestamp}</Text>
            <Text style={styles.text}>PM2.5: {item.pm25} µg/m³</Text>
            <Text style={styles.text}>PM10: {item.pm10} µg/m³</Text>
          </View>
        )}
      />
    </View>
  );
}

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#f0f0f0',
      padding: 20,
      marginTop: 30,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: isDark ? '#fff' : '#000',
    },
    item: {
      backgroundColor: isDark ? '#1e1e1e' : '#ffffff',
      padding: 15,
      borderRadius: 10,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    text: {
      color: isDark ? '#e0e0e0' : '#333',
      fontSize: 16,
    },
  });
}