import React from "react";
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default function CalendarView({
  selectedDate,
  onSelectDate,
  currentMonth,
  onMonthChange,
  availableDates = new Set(),
}) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = startOfWeek(firstDay, { weekStartsOn: 1 });

  const days = [];
  let day = startDate;
  while (days.length < 42) {
    days.push(new Date(day));
    day = addDays(day, 1);
  }

  const prevMonth = () => onMonthChange(new Date(year, month - 1, 1));
  const nextMonth = () => onMonthChange(new Date(year, month + 1, 1));

  const isPastDay = (d) => isBefore(d, startOfDay(new Date())) && !isToday(d);
  const hasAvailability = (d) => availableDates.has(format(d, "yyyy-MM-dd"));

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-full hover:bg-accent">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-lg font-bold font-heading text-foreground flex items-center gap-2 capitalize">
          <Sparkles className="w-4 h-4 text-primary" />
          {format(currentMonth, "MMMM yyyy", { locale: fr })}
        </h2>
        <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-full hover:bg-accent">
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-semibold text-muted-foreground py-2">
            {wd}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isCurrentMonth = d.getMonth() === month;
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const past = isPastDay(d);
          const today = isToday(d);
          const available = hasAvailability(d);

          return (
            <motion.button
              key={i}
              whileHover={!past && isCurrentMonth ? { scale: 1.1 } : {}}
              whileTap={!past && isCurrentMonth ? { scale: 0.95 } : {}}
              onClick={() => !past && isCurrentMonth && onSelectDate(d)}
              disabled={past || !isCurrentMonth}
              className={`
                relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all
                ${!isCurrentMonth ? "text-muted-foreground/30 cursor-default" : ""}
                ${past ? "text-muted-foreground/40 cursor-not-allowed" : ""}
                ${isCurrentMonth && !past && !isSelected ? "hover:bg-accent text-foreground cursor-pointer" : ""}
                ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : ""}
                ${today && !isSelected ? "ring-2 ring-primary/30" : ""}
                ${available && !past && isCurrentMonth && !isSelected ? "font-bold" : ""}
              `}
            >
              {d.getDate()}
              {available && !past && isCurrentMonth && (
                <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                }`} />
              )}
              {today && !available && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
