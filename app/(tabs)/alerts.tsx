import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const alerts = [
  { id: '1', level: 'Alerta roja', pm25: 95, date: '2025-06-03 22:00' },
  { id: '2', level: 'Alerta amarilla', pm25: 45, date: '2025-06-02 16:00' },
];

const getColor = (level: string, colorScheme: string | null) => {
  const isDark = colorScheme === 'dark';

  if (level.includes('roja')) return isDark ? '#cc0000' : '#ff4d4d';
  if (level.includes('amarilla')) return isDark ? '#999900' : '#ffcc00';
  return isDark ? '#004d00' : '#aaffaa';
};


export default function AlertsScreen() {
    const colorScheme = useColorScheme();
      const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title,{color: theme.text}]}>Alertas Recientes</Text>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.alertCard, { backgroundColor: getColor(item.level, colorScheme ?? null) }]}>
            <Text style={[styles.alertText,{color: theme.text}]}>{item.level}</Text>
            <Text style={[{color: theme.text}]}>PM2.5: {item.pm25} µg/m³</Text>
            <Text style={[{color: theme.text}]}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1},
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 30  },
  alertCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  alertText: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
  },
});
