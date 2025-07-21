import React, { useRef, useState, useEffect } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { StatusBar as RNStatusBar, Platform } from "react-native";
import { Provider, useDispatch } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";

import store from "./store/store";
import { loadTasks } from "./utils/storage";
import { setTasks } from "./store/tasksSlice";
import { configureNotificationChannel } from "./utils/notifications";
import CustomHeader from "./components/CustomHeader";

import AllTasksScreen from "./screens/AllTasks";
import CompletedTasksScreen from "./screens/CompletedTasks";
import ImportantTasksScreen from "./screens/ImportantTasks";
import IncompleteTasksScreen from "./screens/IncompletedTasks";

import { ThemeProvider, useTheme } from "./ThemeContext";
import { lightTheme, darkTheme } from "./themes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createBottomTabNavigator();

const InitApp = ({ setHeaderTitle }) => {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const navRef = useNavigationContainerRef();
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  useEffect(() => {
    (async () => {
      if (Platform.OS === "android") {
        await configureNotificationChannel();

        RNStatusBar.setBackgroundColor(currentTheme.background, true);
      }

      const permissions = await Notifications.getPermissionsAsync();
      if (!permissions.granted) {
        const request = await Notifications.requestPermissionsAsync();
        if (!request.granted) {
          alert("Please enable notifications to use the alarm feature.");
        }
      }

      const storedTasks = await loadTasks();
      dispatch(setTasks(storedTasks));
    })();
  }, []);

  return (
    <NavigationContainer
      ref={navRef}
      onReady={() => {
        const route = navRef.getCurrentRoute();
        if (route) setHeaderTitle(route.name);
      }}
      onStateChange={() => {
        const route = navRef.getCurrentRoute();
        if (route) setHeaderTitle(route.name);
      }}
    >
      <ExpoStatusBar style={theme === "dark" ? "light" : "dark"} />
      <Tab.Navigator
        initialRouteName="All"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: {
            backgroundColor: currentTheme.tabBackground,
            borderTopColor: currentTheme.card,
            paddingBottom: 5,
            height: 65,
          },
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: "600",
          },
          tabBarActiveTintColor: currentTheme.tabActive,
          tabBarInactiveTintColor: currentTheme.tabInactive,
          tabBarIcon: ({ color, size }) => {
            let iconName;
            switch (route.name) {
              case "All":
                iconName = "list";
                break;
              case "Important":
                iconName = "heart";
                break;
              case "Completed":
                iconName = "checkmark-done";
                break;
              case "Incomplete":
                iconName = "time";
                break;
              default:
                iconName = "ellipse";
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="All" component={AllTasksScreen} />
        <Tab.Screen name="Important" component={ImportantTasksScreen} />
        <Tab.Screen name="Incomplete" component={IncompleteTasksScreen} />
        <Tab.Screen name="Completed" component={CompletedTasksScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  const [headerTitle, setHeaderTitle] = useState("All Tasks");

  const titleMap = {
    All: "All Tasks",
    Important: "Important Tasks",
    Incomplete: "Incomplete Tasks",
    Completed: "Completed Tasks",
  };

  return (
    <Provider store={store}>
      <ThemeProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <CustomHeader title={titleMap[headerTitle] || "Tasks"} />
          <InitApp setHeaderTitle={setHeaderTitle} />
        </SafeAreaView>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
