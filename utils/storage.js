import AsyncStorage from "@react-native-async-storage/async-storage";

const TASKS_KEY = "tasks";

export const saveTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Error saving tasks", error);
  }
};

export const loadTasks = async () => {
  try {
    const data = await AsyncStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading tasks", error);
    return [];
  }
};
