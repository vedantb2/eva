import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  actions: {
    icon: string;
    label: string;
    onPress: () => void;
  }[];
}

export function ActionSheet({ visible, onClose, actions }: ActionSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.action}
              onPress={() => {
                action.onPress();
                onClose();
              }}
            >
              <FontAwesome
                name={action.icon}
                size={20}
                color="#007AFF"
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#f5f5f5",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
  },
  actionIcon: {
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: "#007AFF",
  },
  cancelButton: {
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "600",
  },
});
