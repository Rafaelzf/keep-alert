import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/text';

export function MapLoading() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Carregando mapa...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    gap: 16,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});
