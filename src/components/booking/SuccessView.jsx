import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, Calendar, Clock, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function SuccessView({ appointment, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="bg-card rounded-2xl shadow-sm border border-border p-6 md:p-8 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
        className="w-16 h-16 mx-auto mb-5 bg-green-100 rounded-full flex items-center justify-center"
      >
        <CheckCircle className="w-8 h-8 text-green-500" />
      </motion.div>

      <h2 className="text-2xl font-extrabold font-heading text-foreground mb-2">
        C'est confirmé ! 🎉
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Votre rendez-vous a été réservé et confirmé.
      </p>

      <div className="bg-accent/50 rounded-xl p-5 mb-6 space-y-3 text-left">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Date</p>
            <p className="font-semibold text-foreground">
              {format(new Date(appointment.date + "T12:00:00"), "EEEE d MMMM yyyy", { locale: fr })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Heure</p>
            <p className="font-semibold text-foreground">{appointment.time}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="w-4 h-4 text-primary flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Confirmation envoyée à</p>
            <p className="font-semibold text-foreground">{appointment.client_email}</p>
          </div>
        </div>
      </div>

      <Button
        onClick={onReset}
        variant="outline"
        className="rounded-xl font-semibold"
      >
        <Heart className="w-4 h-4 mr-2 text-primary" />
        Réserver un autre rendez-vous
      </Button>
    </motion.div>
  );
}