import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import uuid from "react-native-uuid";
import { useDispatch } from "react-redux";
import { addTask, updateTask, deleteTask } from "../store/tasksSlice";
import {
  scheduleAlarmNotification,
  cancelAlarmNotification,
} from "../utils/notifications";
import { Audio } from "expo-av";

const soundMap = {
  "beep.wav": require("../assets/sounds/beep.wav"),
  "chime.mp3": require("../assets/sounds/chime.mp3"),
  "alarm.wav": require("../assets/sounds/alarm.wav"),
};

const playSound = async (soundFile) => {
  try {
    const source = soundMap[soundFile];
    if (!source) {
      console.warn("Sound not found in soundMap:", soundFile);
      return;
    }

    const { sound } = await Audio.Sound.createAsync(source);
    await sound.playAsync();

    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.error("Error playing sound:", error);
  }
};


const InputData = ({ visible, setVisible, updatedData, setUpdatedData }) => {
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    title: "",
    desc: "",
    important: false,
    alarmTime: null,
    notificationId: null,
    sound: "default",
  });

  const [enableDate, setEnableDate] = useState(false);
  const [enableTime, setEnableTime] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (visible) {
      if (updatedData?.id) {
        const alarm = updatedData.alarmTime
          ? new Date(updatedData.alarmTime)
          : null;

        setForm({
          title: updatedData.title || "",
          desc: updatedData.desc || "",
          important: updatedData.important ?? false,
          alarmTime: alarm,
          notificationId: updatedData.notificationId || null,
          sound: updatedData.sound || "default",
        });

        if (alarm) {
          setEnableDate(true);
          setEnableTime(alarm.getHours() !== 0 || alarm.getMinutes() !== 0);
        }
      } else {
        resetForm(false);
      }
    }
  }, [visible, updatedData?.id]);

  const resetForm = (hide = true) => {
    if (hide) setVisible(false);
    setForm({
      title: "",
      desc: "",
      important: false,
      alarmTime: null,
      notificationId: null,
      sound: "default",
    });
    setEnableDate(false);
    setEnableTime(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    setUpdatedData({});
    setErrors({});
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const updated = new Date(form.alarmTime || new Date());
      updated.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setForm((prev) => ({ ...prev, alarmTime: updated }));
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const updated = new Date(form.alarmTime || new Date());
      updated.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setForm((prev) => ({ ...prev, alarmTime: updated }));
    }
  };

  const handleSubmit = async () => {
    const currentErrors = {};
    if (!form.title.trim()) currentErrors.title = true;
    if (!form.desc.trim()) currentErrors.desc = true;
    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    const now = new Date();
    let alarm = new Date(form.alarmTime || now);
    if (enableDate || enableTime) {
      if (!enableDate) {
        alarm.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
      }
      if (!enableTime) {
        alarm.setHours(9, 0);
      }
      alarm.setSeconds(0, 0);
    }
    const alarmTime = enableDate || enableTime ? alarm : null;
    if (updatedData?.notificationId) {
      await cancelAlarmNotification(updatedData.notificationId);
    }

    const notificationId = alarmTime
      ? await scheduleAlarmNotification(
          form.title,
          new Date(alarmTime),
          form.sound
        )
      : null;

    const payload = {
      ...form,
      alarmTime: alarmTime ? new Date(alarmTime).toISOString() : null,
      notificationId,
    };

    if (updatedData?.id) {
      dispatch(updateTask({ id: updatedData.id, ...payload }));
    } else {
      dispatch(
        addTask({
          id: uuid.v4(),
          createdAt: new Date().toISOString(),
          completed: false,
          ...payload,
        })
      );
    }

    resetForm();
  };

  const handleDelete = () => {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (updatedData?.notificationId) {
            await cancelAlarmNotification(updatedData.notificationId);
          }
          dispatch(deleteTask(updatedData.id));
          resetForm();
        },
      },
    ]);
  };

  const formattedDate = form.alarmTime
    ? new Date(form.alarmTime).toLocaleDateString()
    : "";
  const formattedTime = form.alarmTime
    ? new Date(form.alarmTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              onPress={() => resetForm()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>

            <TextInput
              style={[styles.input, errors.title && styles.errorInput]}
              placeholder="Title"
              placeholderTextColor="#ccc"
              value={form.title}
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, title: text }));
                setErrors((e) => ({ ...e, title: false }));
              }}
            />

            <TextInput
              style={[
                styles.input,
                styles.descInput,
                errors.desc && styles.errorInput,
              ]}
              placeholder="Description"
              placeholderTextColor="#ccc"
              value={form.desc}
              multiline
              onChangeText={(text) => {
                setForm((prev) => ({ ...prev, desc: text }));
                setErrors((e) => ({ ...e, desc: false }));
              }}
            />

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Mark as Important</Text>
              <Switch
                value={form.important}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, important: v }))
                }
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set Date</Text>
              <Switch
                value={enableDate}
                onValueChange={(v) => setEnableDate(v)}
              />
            </View>

            {enableDate && (
              <>
                <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                  <Text style={styles.previewText}>
                    {formattedDate || "Tap to select date"}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    mode="date"
                    display="default"
                    value={form.alarmTime || new Date()}
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Set Time</Text>
              <Switch
                value={enableTime}
                onValueChange={(v) => setEnableTime(v)}
              />
            </View>

            {enableTime && (
              <>
                <TouchableOpacity onPress={() => setShowTimePicker(true)}>
                  <Text style={styles.previewText}>
                    {formattedTime || "Tap to select time"}
                  </Text>
                </TouchableOpacity>
                {showTimePicker && (
                  <DateTimePicker
                    mode="time"
                    display="default"
                    value={form.alarmTime || new Date()}
                    onChange={handleTimeChange}
                    is24Hour={false}
                  />
                )}
              </>
            )}

            {(enableDate || enableTime) && (
              <View style={styles.pickerContainer}>
                <Text style={styles.switchLabel}>Alarm Sound</Text>
                <Picker
                  selectedValue={form.sound || "default"}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, sound: value }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#fff"
                  itemStyle={{ color: "#fff" }}
                >
                  <Picker.Item label="System Default" value="default" />
                  <Picker.Item label="Beep" value="beep.wav" />
                  <Picker.Item label="Chime" value="chime.mp3" />
                  <Picker.Item label="Alarm Tone" value="alarm.wav" />
                </Picker>

                {form.sound !== "default" && (
                  <TouchableOpacity
                    onPress={() => playSound(form.sound)}
                    style={styles.previewButton}
                  >
                    <Text style={styles.previewText}>▶️ Preview Sound</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitText}>
                {updatedData?.id ? "Update" : "Add Task"}
              </Text>
            </TouchableOpacity>

            {updatedData?.id && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.submitText}>Delete Task</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default InputData;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(31, 41, 55, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#111827",
    width: "90%",
    borderRadius: 10,
    padding: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  input: {
    backgroundColor: "#374151",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  descInput: {
    height: 90,
    textAlignVertical: "top",
  },
  errorInput: {
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  switchLabel: {
    color: "#fff",
    fontSize: 16,
  },
  previewText: {
    color: "#9ca3af",
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 4,
  },
  submitButton: {
    backgroundColor: "#3b82f6",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  pickerContainer: {
    marginBottom: 10,
  },
  picker: {
    color: "#fff",
    backgroundColor: "#374151",
    borderRadius: 8,
    marginTop: 4,
  },
  previewButton: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#374151",
    borderRadius: 6,
  },
});
