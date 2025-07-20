import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  FlatList,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { toggleComplete } from "../store/tasksSlice";
import { useTheme } from "../ThemeContext";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const Cards = ({ home, setInputVisible, data, setUpdatedData }) => {
  const dispatch = useDispatch();
  const [expandedId, setExpandedId] = useState(null);
  const [sortType, setSortType] = useState("time");
  const [visibleData, setVisibleData] = useState([]);

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (data?.length) {
      const sorted = [...data];
      switch (sortType) {
        case "time":
          sorted.sort(
            (a, b) => new Date(a.alarmTime || 0) - new Date(b.alarmTime || 0)
          );
          break;
        case "newest":
          sorted.sort(
            (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          );
          break;
        case "oldest":
          sorted.sort(
            (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
          );
          break;
        case "az":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
      setVisibleData(sorted);
    }
  }, [data, sortType]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prevId) => (prevId === id ? null : id));
  };

  const getRemainingTime = (alarmTime) => {
    const now = new Date();
    const target = new Date(alarmTime);
    const diff = target - now;

    if (diff <= 0) return "⏰ Time's up";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const daysLeft = Math.floor(hours / 24);
      return `🗓 ${daysLeft} day${daysLeft > 1 ? "s" : ""} left`;
    }

    return `⏳ ${hours}h ${minutes}m left`;
  };

  const openEditModal = (task) => {
    setUpdatedData({
      id: task.id,
      title: task.title,
      desc: task.desc,
      important: task.important,
      alarmTime: task.alarmTime,
      notificationId: task.notificationId,
    });
    setInputVisible(true);
  };

  const renderItem = ({ item: task }) => {
    const isExpanded = expandedId === task.id;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: isDark ? "#1f2937" : "#e5e7eb" },
        ]}
        activeOpacity={0.8}
        onPress={() => toggleExpand(task.id)}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
              {task.title}
            </Text>
            {task.alarmTime && (
              <Text
                style={[
                  styles.remainingTime,
                  { color: isDark ? "#9ca3af" : "#374151" },
                ]}
              >
                {getRemainingTime(task.alarmTime)}
              </Text>
            )}
          </View>

          <View style={styles.iconGroup}>
            {task.important && (
              <Ionicons
                name="heart"
                size={18}
                color="#ef4444"
                style={styles.icon}
              />
            )}
            <TouchableOpacity onPress={() => openEditModal(task)}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#3b82f6"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <>
            <Text
              style={[styles.desc, { color: isDark ? "#d1d5db" : "#111827" }]}
            >
              {task.desc}
            </Text>
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  { backgroundColor: task.completed ? "#047857" : "#f87171" },
                ]}
                onPress={() => dispatch(toggleComplete(task.id))}
              >
                <Text style={styles.statusText}>
                  {task.completed ? "Completed" : "Incomplete"}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDark ? "#111827" : "#f9fafb" }}
    >
      <View style={styles.container}>
        <View
          style={[
            styles.sortContainer,
            { backgroundColor: isDark ? "#1f2937" : "#e5e7eb" },
          ]}
        >
          <Text style={[styles.sortLabel, { color: isDark ? "#fff" : "#111" }]}>
            Sort by:
          </Text>
          <Picker
            selectedValue={sortType}
            onValueChange={(value) => setSortType(value)}
            style={[styles.sortPicker, { color: isDark ? "#fff" : "#111" }]}
            dropdownIconColor={isDark ? "#fff" : "#000"}
            mode="dropown"
          >
            <Picker.Item label="Time" value="time" />
            <Picker.Item label="Newest" value="newest" />
            <Picker.Item label="Oldest" value="oldest" />
            <Picker.Item label="A-Z" value="az" />
          </Picker>
        </View>

        <FlatList
          data={visibleData}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        {home === "true" && (
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => setInputVisible(true)}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

export default Cards;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  sortLabel: {
    marginRight: 8,
    fontSize: 20,
    fontWeight: 600,
  },
  sortPicker: {
    flex: 1,
  },
  list: {
    paddingTop: 5,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    marginRight: 12,
  },
  remainingTime: {
    fontSize: 13,
    marginTop: 4,
  },
  desc: {
    fontSize: 14,
    marginVertical: 8,
  },
  footerRow: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statusButton: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 100,
  },
  statusText: {
    color: "#fff",
    fontSize: 15,
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#3b82f6",
    borderRadius: 30,
    padding: 16,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  icon: {
    marginLeft: 8,
  },
});
