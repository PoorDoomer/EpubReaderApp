import React, { useRef, useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    saveLastLocation,
    getLastLocation,
    addBookmark,
    getBookmarks,
  } from '../storage/Database';

const EpubReader = ({ fileUri }) => {
  const webviewRef = useRef(null);
  const [showButtons, setShowButtons] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [bookmarks, setBookmarks] = useState([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const goNext = () => {
    webviewRef.current.injectJavaScript(`rendition.next(); true;`);
  };

  const goPrev = () => {
    webviewRef.current.injectJavaScript(`rendition.prev(); true;`);
  };

  const toggleButtons = () => {
    setShowButtons(!showButtons);
    Animated.timing(fadeAnim, {
      toValue: showButtons ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderRelease: (evt, gestureState) => {
      if (Math.abs(gestureState.dx) > 50) {
        if (gestureState.dx > 0) {
          goPrev();
        } else {
          goNext();
        }
      } else if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
        toggleButtons();
      }
    },
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://unpkg.com/epubjs/dist/epub.js"></script>
      <style>
        body { margin: 0; padding: 0; background-color: #f8f8f8; }
        #viewer { height: 100vh; }
      </style>
    </head>
    <body>
      <div id="viewer"></div>
      <script>
        var book = ePub("${fileUri}");
        var rendition = book.renderTo("viewer", {
          width: "100%",
          height: "100%"
        });
        window.locationBridge = {
          getLocation: function() {
            return rendition.currentLocation();
          }
        };
        rendition.display();
      </script>
    </body>
    </html>
  `;

  useEffect(() => {
    const loadBook = () => {
      getLastLocation(fileUri, (savedCfi) => {
        if (savedCfi) {
          webviewRef.current.injectJavaScript(`
            rendition.display("${savedCfi}");
          `);
        }
      });

      getBookmarks(fileUri, (savedBookmarks) => {
        setBookmarks(savedBookmarks);
      });
    };

    loadBook();
  }, [fileUri]);

  const addCurrentBookmark = () => {
    webviewRef.current.injectJavaScript(`
      (function() {
        var cfi = rendition.currentLocation().start.cfi;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'bookmark', cfi: cfi }));
      })();
      true;
    `);
  };

  const onMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'bookmark') {
      addBookmark(fileUri, data.cfi);
      setBookmarks((prev) => [...prev, data.cfi]);
    } else if (data.type === 'locationChanged') {
      saveLastLocation(fileUri, data.cfi);
    }
  };

  const onNavigationStateChange = () => {
    webviewRef.current.injectJavaScript(`
      (function() {
        var cfi = rendition.currentLocation().start.cfi;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locationChanged', cfi: cfi }));
      })();
      true;
    `);
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={onMessage}
        onNavigationStateChange={onNavigationStateChange}
      />
      {showButtons && (
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.button} onPress={goPrev}>
            <Icon name="chevron-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={addCurrentBookmark}>
            <Icon name="bookmark-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={goNext}>
            <Icon name="chevron-forward-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  webview: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    bottom: 40,
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EpubReader;
