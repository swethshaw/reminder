import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import InputData from "../components/InputData";
import Cards from "../components/Cards";
import Loader from "../components/Loader";
import { clearCompletedTasks } from "../store/tasksSlice";
import { useTheme } from "../ThemeContext";
import { lightTheme, darkTheme } from "../themes";

const CompletedTasksScreen = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.tasks);
  const completedTasks = tasks?.filter((task) => task.completed);

  const [inputVisible, setInputVisible] = useState(false);
  const [updatedData, setUpdatedData] = useState({ id: "", title: "", desc: "" });

  const { theme } = useTheme();
  const isDark = theme === "dark";
  const currentTheme = isDark ? darkTheme : lightTheme;

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Completed Tasks",
      "Are you sure you want to delete all completed tasks?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => dispatch(clearCompletedTasks()),
          style: "destructive",
        },
      ]
    );
  };

  if (!tasks) {
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        <Loader />
      </View>
    );
  }

  if (completedTasks.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        <Text style={[styles.noTaskText, { color: currentTheme.text }]}>No Completed Task</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Cards
        home={false}
        data={completedTasks}
        setInputVisible={setInputVisible}
        setUpdatedData={setUpdatedData}
      />

      <TouchableOpacity
        style={[styles.clearButton, { backgroundColor: "#ef4444" }]} // you can theme this too if needed
        onPress={handleClearAll}
      >
        <Text style={styles.clearButtonText}>Clear All</Text>
      </TouchableOpacity>

      <InputData
        visible={inputVisible}
        setVisible={setInputVisible}
        updatedData={updatedData}
        setUpdatedData={setUpdatedData}
      />
    </View>
  );
};

export default CompletedTasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
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
  clearButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  clearButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
