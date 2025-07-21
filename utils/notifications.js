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
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      console.log(
        `Notification channel 'alarm' configured with sound: ${channelSound || "default"}`
      );
    } catch (error) {
      console.error("Failed to configure notification channel:", error);
    }
  }
};

export const scheduleAlarmNotification = async (title, time, sound = "default") => {
  if (!time || new Date(time) < new Date()) return null;

  try {
    const content = {
      title: "🔔 Reminder",
      body: `Reminder: ${title}`,
      sound: Platform.OS === "android" ? undefined : sound,
    };

    if (Platform.OS === "android") {
      await configureNotificationChannel(sound);
    }

    const id = await Notifications.scheduleNotificationAsync({
      content,
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
