import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { User, Mail, MessageSquare, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function BookingForm({ onSubmit, isSubmitting = false, bookingType, selectedItem }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes("");
  }, [bookingType, selectedItem?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, email, notes });
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6 space-y-4"
    >
      <h3 className="text-base font-bold font-heading text-foreground mb-2">
        Vos informations 💌
      </h3>

      {selectedItem && (
        <div className="rounded-xl bg-accent/60 p-4 text-sm">
          <p className="font-semibold text-foreground">
            {bookingType === "funding" ? selectedItem.activity_name : "Rendez-vous sélectionné"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {bookingType === "funding"
              ? `Objectif : €${selectedItem.goal} · Collecté : €${selectedItem.amount}`
              : `${selectedItem.date} à ${selectedItem.time} · €${selectedItem.price || 50}`}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-primary" />
          Nom complet
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Marie Dupont"
          required
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-primary" />
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
          className="rounded-xl"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          Notes (facultatif)
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={
            bookingType === "funding"
              ? "Un message de soutien à transmettre..."
              : "Une précision à nous transmettre..."
          }
          className="rounded-xl h-20 resize-none"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting || !name || !email}
        className="w-full rounded-xl font-bold text-base h-12 shadow-lg shadow-primary/20"
      >
        {isSubmitting
          ? "Traitement..."
          : bookingType === "funding"
            ? "Continuer vers le soutien"
            : "Continuer vers le paiement"}
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.form>
  );
}