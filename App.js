import React, { useState ,useEffect} from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import EpubReader from './components/EpubReader';

export default function App() {
  const [fileUri, setFileUri] = useState(null);
  useEffect(() => {
    initializeDatabase();
  }, []);
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/epub+zip',
      });

      console.log('Document picker result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedFile = result.assets[0];
        console.log('File selected:', selectedFile.uri);
        setFileUri(selectedFile.uri);
      } else if (result.canceled) {
        console.log('Document picking cancelled');
      } else {
        console.log('Document picking failed');
        Alert.alert('Error', 'Failed to pick the document. Please try again.');
      }
    } catch (error) {
      console.error('Error in pickDocument:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    }
  };

  console.log('Current fileUri:', fileUri);

  return (
    <View style={styles.container}>
      {fileUri ? (
        <EpubReader fileUri={fileUri} />
      ) : (
        <TouchableOpacity style={styles.button} onPress={pickDocument}>
          <Text style={styles.buttonText}>Select EPUB</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
