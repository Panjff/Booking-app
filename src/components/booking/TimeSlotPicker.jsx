import React from "react";
import { format } from "date-fns";
import { Clock, Heart, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TimeSlotPicker({ selectedDate, slots, selectedSlot, onSelectSlot, isLoading }) {
  if (!selectedDate) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center min-h-[280px]">
        <Heart className="w-10 h-10 text-primary/30 mb-3" />
        <p className="text-muted-foreground text-center font-medium">
          Choisissez une date pour voir les créneaux ✨
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => !s.is_booked);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6">
      <h3 className="text-base font-bold font-heading text-foreground mb-1 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Créneaux disponibles
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {format(selectedDate, "EEEE, MMMM d")}
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground text-sm">Aucun créneau disponible ce jour 😢</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Essayez une autre date !</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <AnimatePresence>
            {availableSlots.map((slot, idx) => (
              <motion.button
                key={slot.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: idx * 0.04 }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectSlot(slot)}
                className={`
                  px-3 py-3 rounded-xl text-sm font-semibold transition-all border
                  ${selectedSlot?.id === slot.id
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-secondary/50 text-foreground border-border hover:border-primary/40 hover:bg-accent"
                  }
                `}
              >
                <span>{slot.time}</span>
                <span className="block text-xs font-normal mt-0.5 opacity-70">
                  €{slot.price || 50}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}