import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useSelector } from "react-redux";

import Loader from "../components/Loader";
import Cards from "../components/Cards";

const ImportantTasksScreen = () => {
  const tasks = useSelector((state) => state.tasks);
  const importantTasks = tasks?.filter((task) => task.important);

  if (!tasks) {
    return (
      <View style={styles.centered}>
        <Loader />
      </View>
    );
  }

  if (importantTasks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noTaskText}>No Important Task</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Cards home={false} data={importantTasks} />
    </ScrollView>
  );
};

export default ImportantTasksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
  },
  noTaskText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#6b7280",
  },
});
