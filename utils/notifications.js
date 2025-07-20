import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export const configureNotificationChannel = async (sound = "default") => {
  if (Platform.OS === "android") {
    try {
      const channelSound =
        sound === "default" ? undefined : sound.replace(/\.\w+$/, "");

      await Notifications.setNotificationChannelAsync("alarm", {
        name: "Alarm Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        sound: channelSound,
        vibrationPattern: [0, 500, 1000],
        lightColor: "#FF231F7C",
        bypassDnd: true,
      });

      console.log(`Notification channel configured with sound: ${channelSound || "default"}`);
    } catch (error) {
      console.error("Failed to configure notification channel:", error);
    }
  }
};

export const scheduleAlarmNotification = async (title, time, sound = "default") => {
  if (!time || new Date(time) < new Date()) return null;

  try {
    let notificationContent = {
      title: "🔔 Reminder",
      body: `Reminder: ${title}`,
    };

    if (Platform.OS === "android") {
      await configureNotificationChannel(sound);
      notificationContent.sound = undefined;
    } else {
      notificationContent.sound = sound === "default" ? "default" : sound;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: notificationContent,
      trigger: {
        date: new Date(time),
        channelId: "alarm",
      },
    });

    console.log("Scheduled Alarm Notification:", id);
    return id;
  } catch (error) {
    console.error("Alarm scheduling failed:", error);
    return null;
  }
};

export const cancelAlarmNotification = async (id) => {
  try {
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      console.log("Cancelled Alarm Notification:", id);
    }
  } catch (error) {
    console.error("Failed to cancel notification:", error);
  }
};
