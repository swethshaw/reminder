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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { toggleComplete } from "../store/tasksSlice";
import { useTheme } from "../ThemeContext";
import DropDownPicker from "react-native-dropdown-picker";

// Enable layout animation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ✅ Extract and validate URLs
const extractValidUrls = (urlArray) => {
  if (!Array.isArray(urlArray)) return [];
  return urlArray.filter(
    (line) => /^(https?:\/\/)[^\s$.?#].[^\s]*$/.test(line)
  );
};

const Cards = ({ home, setInputVisible, data, setUpdatedData }) => {
  const dispatch = useDispatch();
  const [expandedId, setExpandedId] = useState(null);
  const [sortType, setSortType] = useState("time");
  const [visibleData, setVisibleData] = useState([]);

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([
    { label: "Time", value: "time" },
    { label: "Newest", value: "newest" },
    { label: "Oldest", value: "oldest" },
    { label: "A-Z", value: "az" },
  ]);

  const { theme } = useTheme();
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
      sound: task.sound,
      urls: task.urls,
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

            {/* 🔗 Show clickable URLs */}
            {extractValidUrls(task.urls).map((url, idx) => (
              <TouchableOpacity key={idx} onPress={() => Linking.openURL(url)}>
                <Text style={[styles.link, { color: isDark ? "#60a5fa" : "#2563eb" }]}>
                  🔗 {url}
                </Text>
              </TouchableOpacity>
            ))}

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
          <DropDownPicker
            open={open}
            value={sortType}
            items={items}
            setOpen={setOpen}
            setValue={setSortType}
            setItems={setItems}
            theme={isDark ? "DARK" : "LIGHT"}
            textStyle={{
              fontSize: 18,
              color: isDark ? "#fff" : "#111",
            }}
            containerStyle={{ flex: 1, marginLeft: 10 }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? "#374151" : "#f3f4f6",
            }}
          />
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
    zIndex: 10,
  },
  sortLabel: {
    fontSize: 18,
    fontWeight: "bold",
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
  link: {
    textDecorationLine: "underline",
    marginBottom: 4,
    marginLeft: 4,
    fontSize: 14,
  },
});
