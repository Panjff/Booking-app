import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Sparkles, Plus, Trash2, Calendar, Clock, DollarSign, Loader2, Zap, LogOut, Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const TIME_SUGGESTIONS = [
  "00:00", "00:30", "01:00", "01:30", "02:00", "02:30",
"03:00", "03:30", "04:00", "04:30", "05:00", "05:30",
"06:00", "06:30", "07:00", "07:30", "08:00", "08:30",
"09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
"12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
"15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
"18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
"21:00", "21:30", "22:00", "22:30", "23:00", "23:30",
];

function ShareLinkCard() {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Impossible de copier. Copiez le lien manuellement.");
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <h2 className="font-bold text-foreground flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" /> Lien de réservation à partager
      </h2>
      <p className="text-sm text-muted-foreground">
        Envoyez ce lien à vos clients pour qu'ils puissent réserver un créneau directement.
      </p>
      <div className="flex items-center gap-2">
        <Input
          value={bookingUrl}
          readOnly
          className="rounded-xl text-sm font-mono bg-muted/50 cursor-pointer"
          onClick={handleCopy}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleCopy}
          className="rounded-xl shrink-0"
          title="Copier le lien"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

export default function ManageSlots() {
  const { user, logout } = useAuth();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [price, setPrice] = useState("50");
  const [filterDate, setFilterDate] = useState("");

  const queryClient = useQueryClient();

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["timeSlots"],
    queryFn: () => api.slots.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.slots.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      setTime("");
      toast.success("Créneau ajouté ! ✨");
    },
    onError: () => toast.error("Impossible d'ajouter le créneau."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.slots.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      toast.success("Créneau supprimé.");
    },
    onError: () => toast.error("Impossible de supprimer ce créneau."),
  });

  const isDuplicate = (d, t) => slots.some((s) => s.date === d && s.time === t);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!date || !time) return;
    if (isDuplicate(date, time)) {
      toast.error("Ce créneau existe déjà pour cette date.");
      return;
    }
    createMutation.mutate({ date, time, price: parseFloat(price) || 50, is_booked: false });
  };

  const handleBulkAdd = async () => {
    if (!date) {
      toast.error("Sélectionnez d'abord une date.");
      return;
    }
    const toCreate = TIME_SUGGESTIONS.filter((t) => !isDuplicate(date, t));
    if (toCreate.length === 0) {
      toast.info("Tous les créneaux existent déjà pour cette date.");
      return;
    }
    try {
      const { count } = await api.slots.bulkCreate({
        date,
        times: toCreate,
        price: parseFloat(price) || 50,
      });
      queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
      toast.success(`${count} créneaux ajoutés pour la journée !`);
    } catch {
      toast.error("Erreur lors de l'ajout groupé.");
    }
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const upcomingSlots = slots
    .filter((s) => s.date >= today)
    .filter((s) => !filterDate || s.date === filterDate);

  const grouped = upcomingSlots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();
  const stats = {
    total: upcomingSlots.length,
    available: upcomingSlots.filter((s) => !s.is_booked).length,
    booked: upcomingSlots.filter((s) => s.is_booked).length,
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-extrabold font-heading">Gérer les disponibilités</h1>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {user.full_name || user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => logout()}
              className="text-xs text-muted-foreground hover:text-destructive rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" />
              Déconnexion
            </Button>
            <Link to="/" className="text-xs text-primary font-semibold hover:underline">
              ← Réservation
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total", value: stats.total, color: "text-foreground" },
            { label: "Disponibles", value: stats.available, color: "text-green-600" },
            { label: "Réservés", value: stats.booked, color: "text-primary" },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-3 text-center">
              <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Share link */}
        <ShareLinkCard />

        {/* Add Slot Form */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Ajouter un créneau
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Date
                </Label>
                <Input
                  type="date"
                  value={date}
                  min={today}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" /> Heure
                </Label>
                <select
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm"
                >
                  <option value="">Choisir une heure...</option>
                  {TIME_SUGGESTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-primary" /> Prix (€)
                </Label>
                <Input
                  type="number"
                  value={price}
                  min="0"
                  step="5"
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="submit"
                disabled={createMutation.isPending || !date || !time}
                className="rounded-xl font-semibold flex-1"
              >
                {createMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" /> Ajouter
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleBulkAdd}
                disabled={!date}
                className="rounded-xl font-semibold"
              >
                <Zap className="w-4 h-4 mr-2" /> Journée complète
              </Button>
            </div>
          </form>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3">
          <Label className="text-xs font-semibold whitespace-nowrap">Filtrer par date :</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="rounded-xl max-w-[180px]"
          />
          {filterDate && (
            <Button variant="ghost" size="sm" onClick={() => setFilterDate("")} className="text-xs">
              Effacer
            </Button>
          )}
        </div>

        {/* Slots List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-10 text-center">
            <Calendar className="w-10 h-10 text-primary/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Aucun créneau à venir</p>
            <p className="text-muted-foreground/60 text-sm mt-1">Ajoutez des créneaux pour commencer</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {sortedDates.map((dateKey) => (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-card rounded-2xl border border-border overflow-hidden"
                >
                  <div className="px-5 py-3 bg-accent/40 border-b border-border flex items-center justify-between">
                    <h3 className="font-bold text-foreground text-sm">
                      {format(new Date(dateKey + "T12:00:00"), "EEEE d MMMM yyyy", { locale: fr })}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {grouped[dateKey].filter((s) => !s.is_booked).length} dispo
                    </Badge>
                  </div>
                  <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {grouped[dateKey]
                      .sort((a, b) => TIME_SUGGESTIONS.indexOf(a.time) - TIME_SUGGESTIONS.indexOf(b.time))
                      .map((slot) => (
                        <div
                          key={slot.id}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-sm ${
                            slot.is_booked
                              ? "bg-muted/50 border-border text-muted-foreground"
                              : "bg-secondary/30 border-border"
                          }`}
                        >
                          <div>
                            <span className="font-semibold">{slot.time}</span>
                            <span className="block text-xs text-muted-foreground">€{slot.price || 50}</span>
                          </div>
                          {slot.is_booked ? (
                            <Badge className="text-[10px] bg-primary/10 text-primary border-0">Réservé</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => deleteMutation.mutate(slot.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
