import React from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StripeProvider } from '@stripe/stripe-react-native';
import AppNavigator from './src/navigation/AppNavigator';
import store from './src/store';
import { LookupProvider } from './src/contexts/lookupContext';
import { NotificationProvider } from './src/contexts/notificationContext';
import { Colors, applyGlobalTypography } from './src/theme';

/** Same publishable key as Portal_App App.js */
const STRIPE_PUBLISHABLE_KEY =
  'pk_test_51SBAG4FTlZb0wcbr19eI8nC5u62DfuaUWRVS51VTERBocxSM9JSEs4ubrW57hYTCAHK9d6jrarrT4SAViKFMqKjT00TrEr3PNV';

applyGlobalTypography();

function App(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Provider store={store}>
        <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.background }}>
          <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
            <LookupProvider>
              <NotificationProvider>
                <StatusBar
                  barStyle="dark-content"
                  backgroundColor={Colors.background}
                />
                <AppNavigator />
              </NotificationProvider>
            </LookupProvider>
          </StripeProvider>
        </SafeAreaProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

export default App;
