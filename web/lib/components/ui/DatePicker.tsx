"use client";

import { useState } from "react";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

interface DatePickerProps {
  value?: string; // Format: "YYYY-MM-DD"
  onChange?: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export function DatePicker({
  value = "",
  onChange,
  label,
  placeholder = "Select date",
  className = "",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? new Date(value) : new Date()
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return placeholder;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateString = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;
    onChange?.(dateString);
    setIsOpen(false);
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    return (
      selectedDate.getFullYear() === currentYear &&
      selectedDate.getMonth() === currentMonthIndex &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthIndex = currentMonth.getMonth();

    return (
      today.getFullYear() === currentYear &&
      today.getMonth() === currentMonthIndex &&
      today.getDate() === day
    );
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
          {formatDate(value)}
        </span>
        <IconCalendar
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

          {/* Calendar modal */}
          <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-neutral-900 rounded-2xl p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <IconChevronLeft
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              </button>

              <h3 className="text-lg font-dmSans-semibold text-neutral-900 dark:text-neutral-100">
                {monthNames[currentMonth.getMonth()]}{" "}
                {currentMonth.getFullYear()}
              </h3>

              <button
                onClick={() => navigateMonth("next")}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <IconChevronRight
                  size={20}
                  className="text-neutral-600 dark:text-neutral-400"
                />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center">
                  <span className="text-xs font-dmSans-medium text-neutral-500 dark:text-neutral-400">
                    {day}
                  </span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 mb-6">
              {getDaysInMonth(currentMonth).map((day, index) => (
                <div key={index} className="p-1">
                  {day ? (
                    <button
                      onClick={() => handleDateSelect(day)}
                      className={`w-10 h-10 rounded-lg text-sm font-dmSans-medium transition-colors ${
                        isSelectedDate(day)
                          ? "bg-pink-600 text-white"
                          : isToday(day)
                          ? "bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400"
                          : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                      }`}
                    >
                      {day}
                    </button>
                  ) : (
                    <div className="w-10 h-10" />
                  )}
                </div>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-dmSans-semibold transition-colors duration-200 hover:bg-neutral-200 dark:hover:bg-neutral-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const todayString = `${today.getFullYear()}-${(
                    today.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}-${today
                    .getDate()
                    .toString()
                    .padStart(2, "0")}`;
                  onChange?.(todayString);
                  setIsOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-pink-600 text-white font-dmSans-semibold transition-colors duration-200 hover:bg-pink-700"
              >
                Today
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
