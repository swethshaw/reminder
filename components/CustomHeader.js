import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../Theme/ThemeContext";
import { lightTheme, darkTheme } from "../Theme/themeColors";

const CustomHeader = ({ title }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const currentTheme = isDark ? darkTheme : lightTheme;

  return (
    <View
      style={[
        styles.header,
        { backgroundColor: isDark ? "#0a0c13ff" : "#b6b4b4ff" },
      ]}
    >
      <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
        {title}
      </Text>
      <TouchableOpacity onPress={toggleTheme}>
        <Ionicons
          name={isDark ? "sunny" : "moon"}
          size={28}
          color={currentTheme.text}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default CustomHeader;
