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

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const extractValidUrls = (urls) => (Array.isArray(urls) ? urls : []);

const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

const getGroupLabel = (dateStr) => {
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  if (!dateStr) return "No Date";
  if (dateStr === today) return "Today";
  if (dateStr === tomorrow) return "Tomorrow";
  return dateStr;
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
    { label: "Group by Date", value: "grouped" },
  ]);

  const { theme } = useTheme();
  const isDark = theme === "dark";

  useEffect(() => {
    if (!data?.length) return;

    const sorted = [...data];

    if (sortType === "grouped") {
      const grouped = {};
      for (const task of sorted) {
        const group = getGroupLabel(
          task.alarmTime ? formatDate(task.alarmTime) : null
        );
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(task);
      }
      // Convert to flat array with section headers
      const groupedList = [];
      Object.keys(grouped)
        .sort((a, b) => new Date(a) - new Date(b))
        .forEach((group) => {
          groupedList.push({ isHeader: true, title: group });
          grouped[group].forEach((task) => groupedList.push({ ...task }));
        });
      setVisibleData(groupedList);
    } else {
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
      const days = Math.floor(hours / 24);
      return `🗓 ${days} day${days > 1 ? "s" : ""} left`;
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

  const renderItem = ({ item }) => {
    if (item.isHeader) {
      return (
        <Text
          style={[
            styles.groupHeader,
            { color: isDark ? "#fbbf24" : "#b45309" },
          ]}
        >
          {item.title}
        </Text>
      );
    }

    const isExpanded = expandedId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: isDark ? "#1f2937" : "#e5e7eb" },
        ]}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: isDark ? "#fff" : "#111" }]}>
              {item.title}
            </Text>
            {item.alarmTime && (
              <Text
                style={[
                  styles.remainingTime,
                  { color: isDark ? "#9ca3af" : "#374151" },
                ]}
              >
                {getRemainingTime(item.alarmTime)}
              </Text>
            )}
          </View>

          <View style={styles.iconGroup}>
            {item.important && (
              <Ionicons
                name="heart"
                size={18}
                color="#ef4444"
                style={styles.icon}
              />
            )}
            <TouchableOpacity onPress={() => openEditModal(item)}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#3b82f6"
              />
            </TouchableOpacity>
          </View>
        </View>

        {isExpanded && (
          <>
            <Text
              style={[styles.desc, { color: isDark ? "#d1d5db" : "#111827" }]}
            >
              {item.desc}
            </Text>
            {extractValidUrls(item.urls).map((urlItem, idx) => {
  const sanitizedUrl = urlItem.startsWith("http://") || urlItem.startsWith("https://")
    ? urlItem
    : `https://${urlItem}`;

  return (
    <TouchableOpacity
      key={idx}
      onPress={async () => {
        const supported = await Linking.canOpenURL(sanitizedUrl);
        if (supported) {
          await Linking.openURL(sanitizedUrl);
        } else {
          Alert.alert("Invalid URL", `Can't open: ${sanitizedUrl}`);
        }
      }}
    >
      <Text style={[styles.link, { color: isDark ? "#60a5fa" : "#2563eb" }]}>
        {urlItem}
      </Text>
    </TouchableOpacity>
  );
})}
            <View style={styles.footerRow}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  { backgroundColor: item.completed ? "#047857" : "#f87171" },
                ]}
                onPress={() => dispatch(toggleComplete(item.id))}
              >
                <Text style={styles.statusText}>
                  {item.completed ? "Completed" : "Incomplete"}
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
            textStyle={{ fontSize: 18, color: isDark ? "#fff" : "#111" }}
            containerStyle={{ flex: 1, marginLeft: 10 }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? "#374151" : "#f3f4f6",
            }}
          />
        </View>

        <FlatList
          data={visibleData}
          keyExtractor={(item, index) =>
            item.id?.toString() ?? `header-${index}`
          }
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
  container: { flex: 1 },
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
    fontSize: 16,
    fontWeight: 500,
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 4,
    marginHorizontal: 8,
  },
});
