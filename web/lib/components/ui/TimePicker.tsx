"use client";

import { useState } from "react";
import { IconClock } from "@tabler/icons-react";

interface TimePickerProps {
  value?: string; // Format: "HH:MM" (24-hour)
  onChange?: (time: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function TimePicker({
  value = "",
  onChange,
  label,
  placeholder = "Select time",
  className = "",
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState(
    value ? parseInt(value.split(":")[0]) : 12
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? parseInt(value.split(":")[1]) : 0
  );
  const [isPM, setIsPM] = useState(
    value ? parseInt(value.split(":")[0]) >= 12 : false
  );

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const formatTime = () => {
    if (!value) return placeholder;

    const hour24 = parseInt(value.split(":")[0]);
    const minute = parseInt(value.split(":")[1]);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const period = hour24 >= 12 ? "PM" : "AM";

    return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = () => {
    const hour24 = isPM
      ? selectedHour === 12
        ? 12
        : selectedHour + 12
      : selectedHour === 12
      ? 0
      : selectedHour;
    const timeString = `${hour24.toString().padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")}`;
    onChange?.(timeString);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-dmSans-medium text-neutral-700 dark:text-neutral-300 mb-2">
          {label}
        </label>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-dmSans-medium text-base focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 transition-all duration-200 text-left flex items-center justify-between ${className}`}
        style={{
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <span className={value ? "" : "text-neutral-500 dark:text-neutral-400"}>
          {formatTime()}
        </span>
        <IconClock
          size={18}
          className="text-neutral-500 dark:text-neutral-400"
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Time picker modal */}
          <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-dmSans-semibold text-neutral-900 dark:text-neutral-100 mb-4 text-center">
              Select Time
            </h3>

            <div className="flex items-center justify-center space-x-4 mb-6">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Hour
                </span>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(parseInt(e.target.value))}
                  className="w-16 h-12 text-center text-lg font-dmSans-bold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  {hours.map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-2xl font-dmSans-bold text-neutral-400 mt-6">
                :
              </span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Minute
                </span>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(parseInt(e.target.value))}
                  className="w-16 h-12 text-center text-lg font-dmSans-bold text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500/50"
                >
                  {minutes
                    .filter((m) => m % 5 === 0)
                    .map((minute) => (
                      <option key={minute} value={minute}>
                        {minute.toString().padStart(2, "0")}
                      </option>
                    ))}
                </select>
              </div>

              {/* AM/PM */}
              <div className="flex flex-col items-center">
                <span className="text-sm font-dmSans-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Period
                </span>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={() => setIsPM(false)}
                    className={`px-3 py-1.5 text-sm font-dmSans-semibold rounded-md transition-colors ${
                      !isPM
                        ? "bg-pink-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setIsPM(true)}
                    className={`px-3 py-1.5 text-sm font-dmSans-semibold rounded-md transition-colors ${
                      isPM
                        ? "bg-pink-600 text-white"
                        : "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-dmSans-semibold transition-colors duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={handleTimeSelect}
                className="flex-1 py-3 px-4 rounded-xl bg-pink-600 text-white font-dmSans-semibold transition-colors duration-200 hover:bg-pink-700"
              >
                Select
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
