import { createSlice } from "@reduxjs/toolkit";
import { saveTasks } from "../utils/storage";
import * as Notifications from "expo-notifications";

const tasksSlice = createSlice({
  name: "tasks",
  initialState: [],
  reducers: {
    setTasks: (state, action) => {
      return action.payload;
    },

    addTask: (state, action) => {
      state.push(action.payload);
      saveTasks(state);
    },

    updateTask: (state, action) => {
      const { id, ...updatedFields } = action.payload;
      const index = state.findIndex((task) => task.id === id);

      if (index !== -1) {
        const oldTask = state[index];

        const shouldCancelNotification =
          (updatedFields.completed && oldTask.notificationId) ||
          (!updatedFields.alarmTime && oldTask.notificationId) ||
          (updatedFields.notificationId &&
            updatedFields.notificationId !== oldTask.notificationId);

        if (shouldCancelNotification) {
          Notifications.cancelScheduledNotificationAsync(oldTask.notificationId)
            .then(() => console.log("Canceled old notification"))
            .catch((err) => console.error("Cancel notification failed", err));
        }

        state[index] = { ...oldTask, ...updatedFields };
        saveTasks(state);
      }
    },

    deleteTask: (state, action) => {
      const task = state.find((t) => t.id === action.payload);

      if (task?.notificationId) {
        Notifications.cancelScheduledNotificationAsync(task.notificationId)
          .then(() => console.log("Notification cancelled on delete"))
          .catch((err) => console.error("Cancel notification failed", err));
      }

      const updated = state.filter((t) => t.id !== action.payload);
      saveTasks(updated);
      return updated;
    },

    toggleComplete: (state, action) => {
      const task = state.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;

        if (task.completed && task.notificationId) {
          Notifications.cancelScheduledNotificationAsync(task.notificationId)
            .then(() => {
              console.log("Notification canceled");
            })
            .catch((err) => console.error("Cancel notification failed", err));
        }

        saveTasks(state);
      }
    },

    toggleImportant: (state, action) => {
      const task = state.find((t) => t.id === action.payload);
      if (task) {
        task.important = !task.important;
        saveTasks(state);
      }
    },

    clearCompletedTasks: (state) => {
      const filtered = state.filter((task) => !task.completed);
      saveTasks(filtered);
      return filtered;
    },
  },
});

export const {
  setTasks,
  addTask,
  updateTask,
  deleteTask,
  toggleComplete,
  toggleImportant,
  clearCompletedTasks,
} = tasksSlice.actions;

export default tasksSlice.reducer;
