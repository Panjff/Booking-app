import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import CalendarView from "@/components/booking/CalendarView";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import BookingForm from "@/components/booking/BookingForm";
import PaymentStep from "@/components/booking/PaymentStep";
import SuccessView from "@/components/booking/SuccessView";

const STEPS = { SELECT: "select", FORM: "form", PAY: "pay", SUCCESS: "success" };

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [step, setStep] = useState(STEPS.SELECT);
  const [clientInfo, setClientInfo] = useState(null);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const queryClient = useQueryClient();

  const { data: allSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["timeSlots"],
    queryFn: () => api.slots.list(),
  });

  const availableDates = useMemo(() => {
    const dates = new Set();
    allSlots.forEach((s) => {
      if (!s.is_booked) dates.add(s.date);
    });
    return dates;
  }, [allSlots]);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const daySlots = useMemo(() => {
    if (!dateStr) return [];
    return allSlots.filter((s) => s.date === dateStr);
  }, [allSlots, dateStr]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    if (step !== STEPS.SELECT) setStep(STEPS.SELECT);
  };

  const handleFormSubmit = (info) => {
    setClientInfo(info);
    setStep(STEPS.PAY);
  };

  const handlePaymentSuccess = (appointment) => {
    setCreatedAppointment(appointment);
    setStep(STEPS.SUCCESS);
    queryClient.invalidateQueries({ queryKey: ["timeSlots"] });
    toast.success("Rendez-vous confirmé ! 🎉");
  };

  const handleReset = () => {
    setStep(STEPS.SELECT);
    setSelectedDate(null);
    setSelectedSlot(null);
    setClientInfo(null);
    setCreatedAppointment(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-extrabold font-heading text-foreground">
              Réserver un rendez-vous
            </h1>
          </div>
          <Link to="/manage" className="text-xs text-primary font-semibold hover:underline">
            Gérer les disponibilités →
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <StepIndicator currentStep={step} />
      </div>

      <main className="max-w-5xl mx-auto px-4 pb-12">
        {step === STEPS.SUCCESS ? (
          <div className="max-w-md mx-auto">
            <SuccessView appointment={createdAppointment} onReset={handleReset} />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <CalendarView
                selectedDate={selectedDate}
                onSelectDate={handleDateSelect}
                currentMonth={currentMonth}
                onMonthChange={setCurrentMonth}
                availableDates={availableDates}
              />
              <TimeSlotPicker
                selectedDate={selectedDate}
                slots={daySlots}
                selectedSlot={selectedSlot}
                onSelectSlot={(slot) => {
                  setSelectedSlot(slot);
                  if (step === STEPS.SELECT) setStep(STEPS.FORM);
                }}
                isLoading={slotsLoading}
              />
            </div>

            <div>
              {step === STEPS.FORM && selectedSlot && (
                <BookingForm onSubmit={handleFormSubmit} />
              )}
              {step === STEPS.PAY && selectedSlot && clientInfo && (
                <PaymentStep
                  slot={selectedSlot}
                  clientInfo={clientInfo}
                  onSuccess={handlePaymentSuccess}
                  onBack={() => setStep(STEPS.FORM)}
                />
              )}
              {step === STEPS.SELECT && (
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="text-4xl mb-3">💖</div>
                  <p className="text-muted-foreground text-center font-medium text-sm">
                    Sélectionnez une date et un créneau pour commencer !
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StepIndicator({ currentStep }) {
  const steps = [
    { key: STEPS.SELECT, label: "Choisir", emoji: "📅" },
    { key: STEPS.FORM, label: "Vos infos", emoji: "✏️" },
    { key: STEPS.PAY, label: "Paiement", emoji: "💳" },
    { key: STEPS.SUCCESS, label: "Confirmé", emoji: "🎉" },
  ];

  const currentIdx = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center justify-center gap-1 md:gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            i <= currentIdx
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }`}>
            <span>{s.emoji}</span>
            <span className="hidden sm:inline">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`w-6 h-0.5 rounded-full ${
              i < currentIdx ? "bg-primary/40" : "bg-border"
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
