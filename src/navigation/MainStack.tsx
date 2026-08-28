import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import MovieDetailScreen from '../screens/MovieDetailScreen';
import FriendProfileScreen from '../screens/FriendProfileScreen';
import { MediaType } from '../types/models';
import { colors } from '../theme';

export type MainStackParamList = {
  MainTabs: undefined;
  MovieDetail: { id: number; mediaType: MediaType };
  FriendProfile: { uid: string; username: string };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export default function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
      }}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="MovieDetail" component={MovieDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={({ route }) => ({ title: `@${route.params.username}` })}
      />
    </Stack.Navigator>
  );
}
