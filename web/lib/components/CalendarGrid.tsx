"use client";

interface Festival {
  name: string;
  nameMarathi: string;
  gregorianDateStart: string;
  icon: string;
}

interface CalendarDay {
  date: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  festival?: Festival;
}

interface CalendarGridProps {
  year: number;
  month: number;
  festivals: Festival[] | undefined;
}

export function CalendarGrid({ year, month, festivals }: CalendarGridProps) {
  const today = new Date().toISOString().split("T")[0];
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const festivalMap = new Map(
    festivals?.map((f) => [f.gregorianDateStart, f]) || []
  );

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const days: CalendarDay[] = [];

  for (let i = 0; i < firstDay; i++) {
    const prevMonthDays = getDaysInMonth(year, month - 1);
    const dayNum = prevMonthDays - firstDay + i + 1;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    days.push({
      date: dateStr,
      dayNum,
      isCurrentMonth: false,
      isToday: dateStr === today,
      festival: festivalMap.get(dateStr),
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({
      date: dateStr,
      dayNum: i,
      isCurrentMonth: true,
      isToday: dateStr === today,
      festival: festivalMap.get(dateStr),
    });
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    days.push({
      date: dateStr,
      dayNum: i,
      isCurrentMonth: false,
      isToday: dateStr === today,
      festival: festivalMap.get(dateStr),
    });
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-neutral-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={`relative p-2 rounded-lg text-center min-h-[60px] transition-colors ${
              day.isToday
                ? "bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-500"
                : day.festival
                ? "bg-green-50 dark:bg-green-900/20"
                : day.isCurrentMonth
                ? "hover:bg-neutral-100 dark:hover:bg-neutral-700"
                : "opacity-40"
            }`}
          >
            <span
              className={`text-sm font-medium ${
                day.isCurrentMonth
                  ? "text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-400 dark:text-neutral-600"
              }`}
            >
              {day.dayNum}
            </span>
            {day.festival && (
              <span className="absolute top-1 right-1 text-xs">
                {day.festival.icon}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
