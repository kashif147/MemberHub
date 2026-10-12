import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store';
import { LookupProvider } from './src/contexts/lookupContext';
import { Colors } from './src/theme/colors';

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Provider store={store}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.background }}>
          <LookupProvider>
            <StatusBar
              barStyle="dark-content"
              backgroundColor={Colors.background}
            />
            <AppNavigator />
          </LookupProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
