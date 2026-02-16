import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { registerRootComponent } from 'expo';

import BulbControlScreen from './src/screens/BulbControlScreen';
import GroupControlScreen from './src/screens/GroupControlScreen';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0a1a' },
          headerTintColor: '#f0f0ff',
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerBackTitleVisible: false,
          contentStyle: { backgroundColor: '#0a0a1a' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BulbControl"
          component={BulbControlScreen}
          options={({ route }) => ({
            title: route.params?.bulb?.name ?? 'Bulb Control',
          })}
        />
        <Stack.Screen
          name="GroupControl"
          component={GroupControlScreen}
          options={({ route }) => ({
            title: route.params?.group?.name ?? 'Group Control',
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

registerRootComponent(App);