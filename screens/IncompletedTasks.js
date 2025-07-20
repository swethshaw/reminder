import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSelector } from "react-redux";

import InputData from "../components/InputData";
import Loader from "../components/Loader";
import Cards from "../components/Cards";
import { useTheme } from "../ThemeContext";
import { lightTheme, darkTheme } from "../themes";

const IncompleteTasksScreen = () => {
  const tasks = useSelector((state) => state.tasks);
  const incompleteTasks = tasks?.filter((task) => !task.completed);

  const [inputVisible, setInputVisible] = useState(false);
  const [updatedData, setUpdatedData] = useState({
    id: "",
    title: "",
    desc: "",
  });

  const { theme } = useTheme();
  const currentTheme = theme === "dark" ? darkTheme : lightTheme;

  if (!tasks) {
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        <Loader />
      </View>
    );
  }

  if (incompleteTasks.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.noTaskText, { color: currentTheme.text }]}>No Incomplete Task</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Cards
        home={false}
        data={incompleteTasks}
        setInputVisible={setInputVisible}
        setUpdatedData={setUpdatedData}
      />

      <InputData
        visible={inputVisible}
        setVisible={setInputVisible}
        updatedData={updatedData}
        setUpdatedData={setUpdatedData}
      />
    </View>
  );
};

export default IncompleteTasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noTaskText: {
    fontSize: 20,
    fontWeight: "600",
  },
});
