import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, type IoniconsIconName } from '@react-native-vector-icons/ionicons/static';
import DashboardScreen from '../screens/DashboardScreen';
import SearchScreen from '../screens/SearchScreen';
import FriendsScreen from '../screens/FriendsScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useAppTheme } from '../context/ThemeContext';

export type MainTabParamList = {
  Dashboard: undefined;
  Search: undefined;
  Friends: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};

/**
 * Outline glyph for an unfocused tab, filled glyph for the active one - the
 * standard iOS tab bar convention, and a restrained way of marking selection
 * (weight, not extra color) in the same spirit as Atlassian's own nav.
 */
const TAB_ICONS: Record<keyof MainTabParamList, { outline: IoniconsIconName; filled: IoniconsIconName }> = {
  Dashboard: { outline: 'list-outline', filled: 'list' },
  Search: { outline: 'search-outline', filled: 'search' },
  Friends: { outline: 'people-outline', filled: 'people' },
  Leaderboard: { outline: 'trophy-outline', filled: 'trophy' },
  Profile: { outline: 'person-circle-outline', filled: 'person-circle' },
};

/** Defined once at module scope (not per-render) so it stays a stable
 * reference for react-navigation's tabBarIcon render prop. */
function renderTabIcon(
  routeName: keyof MainTabParamList,
  focused: boolean,
  color: string,
  size: number,
) {
  const icon = TAB_ICONS[routeName];
  return <Ionicons name={focused ? icon.filled : icon.outline} size={size} color={color} />;
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { colors } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarIcon: ({ color, size, focused }) => renderTabIcon(route.name, focused, color, size),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
