// tasksSlice.js
import { createSlice } from "@reduxjs/toolkit";
import { saveTasks } from "../utils/storage";
import * as Notifications from "expo-notifications";

const initialState = {
  tasks: [],
  defaultAutoDeleteAfter: 1,
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks: (state, action) => {
      state.tasks = action.payload;
    },

    setAutoDeleteAfterDays: (state, action) => {
      state.defaultAutoDeleteAfter = action.payload;
    },

    addTask: (state, action) => {
      const taskWithUrls = {
        ...action.payload,
        urls: action.payload.urls || [],
      };
      state.tasks.push(taskWithUrls);
      saveTasks(state.tasks);
    },

    updateTask: (state, action) => {
      const { id, ...updatedFields } = action.payload;
      const index = state.tasks.findIndex((task) => task.id === id);

      if (index !== -1) {
        const oldTask = state.tasks[index];
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

        state.tasks[index] = {
          ...oldTask,
          ...updatedFields,
          urls:
            updatedFields.urls !== undefined
              ? updatedFields.urls
              : oldTask.urls,
        };

        saveTasks(state.tasks);
      }
    },

    deleteTask: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task?.notificationId) {
        Notifications.cancelScheduledNotificationAsync(task.notificationId)
          .then(() => console.log("Notification cancelled on delete"))
          .catch((err) => console.error("Cancel notification failed", err));
      }
      state.tasks = state.tasks.filter((t) => t.id !== action.payload);
      saveTasks(state.tasks);
    },

    toggleComplete: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.completed = !task.completed;
        if (task.completed) {
          task.completedAt = new Date().toISOString();
          task.autoDeleteAfter = state.defaultAutoDeleteAfter * 1440; // convert days to minutes
        } else {
          task.completedAt = null;
          task.autoDeleteAfter = null;
        }
        if (task.notificationId) {
          Notifications.cancelScheduledNotificationAsync(task.notificationId)
            .then(() => console.log("Notification canceled"))
            .catch((err) => console.error("Cancel notification failed", err));
        }
        saveTasks(state.tasks);
      }
    },

    toggleImportant: (state, action) => {
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.important = !task.important;
        saveTasks(state.tasks);
      }
    },

    clearCompletedTasks: (state) => {
      state.tasks = state.tasks.filter((task) => !task.completed);
      saveTasks(state.tasks);
    },

    deleteExpiredCompletedTasks: (state) => {
      const now = new Date();
      state.tasks = state.tasks.filter((task) => {
        if (!task.completed || !task.completedAt || !task.autoDeleteAfter)
          return true;
        const completedAt = new Date(task.completedAt);
        const expiry = new Date(
          completedAt.getTime() + task.autoDeleteAfter * 60000
        );
        return expiry > now;
      });
      saveTasks(state.tasks);
    },

    addUrlToTask: (state, action) => {
      const { id, url } = action.payload;
      const task = state.tasks.find((t) => t.id === id);
      if (task && url) {
        task.urls = task.urls || [];
        if (!task.urls.includes(url)) {
          task.urls.push(url);
          saveTasks(state.tasks);
        }
      }
    },

    removeUrlFromTask: (state, action) => {
      const { id, url } = action.payload;
      const task = state.tasks.find((t) => t.id === id);
      if (task && url) {
        task.urls = (task.urls || []).filter((u) => u !== url);
        saveTasks(state.tasks);
      }
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
  deleteExpiredCompletedTasks,
  addUrlToTask,
  removeUrlFromTask,
  setAutoDeleteAfterDays,
} = tasksSlice.actions;

export default tasksSlice.reducer;
