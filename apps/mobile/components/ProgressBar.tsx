import { View, StyleSheet } from "react-native";

interface ProgressBarProps {
  progress: number;
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  progress,
  height = 8,
  backgroundColor = "#f0f0f0",
  fillColor = "#007AFF",
}: ProgressBarProps) {
  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
