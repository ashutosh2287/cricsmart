import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/styles/theme";

// Screens
import HomeScreen from "@/screens/HomeScreen";
import MatchesScreen from "@/screens/MatchesScreen";
import AnalyticsScreen from "@/screens/AnalyticsScreen";
import PlayersScreen from "@/screens/PlayersScreen";
import ProfileScreen from "@/screens/ProfileScreen";

export type RootStackParamList = {
  Main: undefined;
  MatchDetail: { matchId: string };
  PlayerDetail: { playerId: string };
  TeamDetail: { teamId: string };
};

export type TabParamList = {
  Home: undefined;
  Matches: undefined;
  Analytics: undefined;
  Players: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer
      theme={{
        dark: true,
        colors: {
          primary: colors.brand,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.danger,
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen
          name="MatchDetail"
          component={MatchDetailScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="PlayerDetail"
          component={PlayerDetailScreen}
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="TeamDetail"
          component={TeamDetailScreen}
          options={{ presentation: "card" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Placeholder screens for detail views
function MatchDetailScreen() {
  return null; // Will be implemented
}

function PlayerDetailScreen() {
  return null; // Will be implemented
}

function TeamDetailScreen() {
  return null; // Will be implemented
}
