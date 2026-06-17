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
  fundingDates = new Set(),
  bookingType = "slot",
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
  const hasFunding = (d) => fundingDates.has(format(d, "yyyy-MM-dd"));

  const getDateColor = (d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const isAvail = availableDates.has(dateStr);
    const isFund = fundingDates.has(dateStr);
    
    if (bookingType === "funding") {
      return isFund ? "blue" : "none";  // Inversé : funding → bleu
    }
    if (isAvail) return "pink";  // Inversé : disponibilité → rose
    if (isFund) return "blue";   // Inversé : funding → bleu
    return "none";
  };

  const getDateClasses = (d, isCurrentMonth, past, isSelected, today) => {
    const color = getDateColor(d);
    const baseClasses = "relative aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all";
    
    if (!isCurrentMonth) {
      return `${baseClasses} text-muted-foreground/30 cursor-default`;
    }
    if (past) {
      return `${baseClasses} text-muted-foreground/40 cursor-not-allowed`;
    }
    if (color === "pink") {  // Inversé : maintenant rose = disponible
      if (isSelected) {
        return `${baseClasses} bg-pink-500 text-white shadow-lg shadow-pink-500/25 cursor-pointer`;
      }
      if (today) {
        return `${baseClasses} ring-2 ring-pink-500/50 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 cursor-pointer`;
      }
      return `${baseClasses} text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/30 font-bold cursor-pointer`;
    }
    
    if (color === "blue") {  // Inversé : maintenant bleu = funding
      if (isSelected) {
        return `${baseClasses} bg-blue-500 text-white shadow-lg shadow-blue-500/25 cursor-pointer`;
      }
      if (today) {
        return `${baseClasses} ring-2 ring-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 cursor-pointer`;
      }
      return `${baseClasses} text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-bold cursor-pointer`;
    }
    if (today) {
      return `${baseClasses} ring-2 ring-primary/30 text-foreground cursor-default`;
    }
    return `${baseClasses} text-muted-foreground/50 cursor-default`;
  };

  const isDateClickable = (d, isCurrentMonth, past) => {
    if (!isCurrentMonth || past) return false;
    const color = getDateColor(d);
    return color !== "none";
  };

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
          const clickable = isDateClickable(d, isCurrentMonth, past);
          const color = getDateColor(d);
          const hasPink = availableDates.has(format(d, "yyyy-MM-dd"));  // Inversé : rose = disponible
          const hasBlue = fundingDates.has(format(d, "yyyy-MM-dd"));    // Inversé : bleu = funding

          return (
            <motion.button
              key={i}
              whileHover={clickable ? { scale: 1.1 } : {}}
              whileTap={clickable ? { scale: 0.95 } : {}}
              onClick={() => clickable && onSelectDate(d)}
              disabled={!clickable}
              className={getDateClasses(d, isCurrentMonth, past, isSelected, today)}
            >
              {d.getDate()}
              {isCurrentMonth && !past && (hasPink || hasBlue) && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasPink && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected && color === "pink" ? "bg-white" : "bg-pink-500"
                    }`} />
                  )}
                  {hasBlue && (
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isSelected && color === "blue" ? "bg-white" : "bg-blue-500"
                    }`} />
                  )}
                </div>
              )}
              
              {today && !hasPink && !hasBlue && isCurrentMonth && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary/50" />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500" />  {/* Inversé : rose = créneaux disponibles */}
          <span className="text-xs text-muted-foreground">Créneaux disponibles</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />  {/* Inversé : bleu = activités à financer */}
          <span className="text-xs text-muted-foreground">Activités à financer</span>
        </div>
      </div>
    </div>
  );
}