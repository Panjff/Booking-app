import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sparkles, Target, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

import CalendarView from "@/components/booking/CalendarView";
import TimeSlotPicker from "@/components/booking/TimeSlotPicker";
import BookingForm from "@/components/booking/BookingForm";
import PaymentStep from "@/components/booking/PaymentStep";
import SuccessView from "@/components/booking/SuccessView";

const STEPS = { SELECT: "select", FORM: "form", PAY: "pay", SUCCESS: "success" };
const BOOKING_TYPES = { SLOT: "slot", FUNDING: "funding" };

export default function Home() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedFunding, setSelectedFunding] = useState(null);
  const [step, setStep] = useState(STEPS.SELECT);
  const [clientInfo, setClientInfo] = useState(null);
  const [createdAppointment, setCreatedAppointment] = useState(null);
  const [bookingType, setBookingType] = useState(BOOKING_TYPES.SLOT);

  const queryClient = useQueryClient();

  const { data: allSlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["timeSlots"],
    queryFn: () => api.slots.list(),
  });

  const { data: allFundings = [], isLoading: fundingsLoading } = useQuery({
    queryKey: ["fundings"],
    queryFn: () => api.fundings.list(),
  });

  const availableDates = useMemo(() => {
    const dates = new Set();
    allSlots.forEach((s) => {
      if (!s.is_booked) dates.add(s.date);
    });
    return dates;
  }, [allSlots]);

  const fundingDates = useMemo(() => {
    const dates = new Set();
    allFundings.forEach((f) => {
      if (!f.is_funded) dates.add(f.date || new Date().toISOString().split('T')[0]);
    });
    return dates;
  }, [allFundings]);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const daySlots = useMemo(() => {
    if (!dateStr) return [];
    return allSlots.filter((s) => s.date === dateStr);
  }, [allSlots, dateStr]);

  const dayFundings = useMemo(() => {
    if (!dateStr) return [];
    return allFundings.filter((f) => f.date === dateStr || !f.date);
  }, [allFundings, dateStr]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSelectedFunding(null);
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
    queryClient.invalidateQueries({ queryKey: ["fundings"] });
    toast.success("Rendez-vous confirmé ! 🎉");
  };

  const handleReset = () => {
    setStep(STEPS.SELECT);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedFunding(null);
    setClientInfo(null);
    setCreatedAppointment(null);
    setBookingType(BOOKING_TYPES.SLOT);
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
          <>
            {bookingType === BOOKING_TYPES.FUNDING && (
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      Avertissement important
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Le paiement effectué dans le cadre du financement d'une activité ne garantit aucunement 
                      une quelconque prestation, service ou résultat de la part d'Émilie. Ce financement est 
                      un soutien volontaire au projet, sans contrepartie obligatoire.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setBookingType(BOOKING_TYPES.SLOT)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        bookingType === BOOKING_TYPES.SLOT
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                          : "border-border hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="font-semibold text-sm">Créneau horaire</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Réserver un créneau</p>
                    </button>
                    <button
                      onClick={() => setBookingType(BOOKING_TYPES.FUNDING)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        bookingType === BOOKING_TYPES.FUNDING
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20"
                          : "border-border hover:border-pink-300"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Target className="w-4 h-4 text-pink-500" />
                        <span className="font-semibold text-sm">Financer une activité</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Soutenir un projet</p>
                    </button>
                  </div>
                </div>

                <CalendarView
                  selectedDate={selectedDate}
                  onSelectDate={handleDateSelect}
                  currentMonth={currentMonth}
                  onMonthChange={setCurrentMonth}
                  availableDates={availableDates}
                  fundingDates={fundingDates}
                  bookingType={bookingType}
                />

                {bookingType === BOOKING_TYPES.SLOT ? (
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
                ) : (
                  <FundingPicker
                    selectedDate={selectedDate}
                    fundings={dayFundings}
                    selectedFunding={selectedFunding}
                    onSelectFunding={(funding) => {
                      setSelectedFunding(funding);
                      if (step === STEPS.SELECT) setStep(STEPS.FORM);
                    }}
                    isLoading={fundingsLoading}
                  />
                )}
              </div>

              <div>
                {step === STEPS.FORM && (selectedSlot || selectedFunding) && (
                  <BookingForm 
                    onSubmit={handleFormSubmit} 
                    bookingType={bookingType}
                    selectedItem={selectedSlot || selectedFunding}
                  />
                )}
                {step === STEPS.PAY && clientInfo && (
                  <PaymentStep
                    slot={selectedSlot}
                    funding={selectedFunding}
                    clientInfo={clientInfo}
                    bookingType={bookingType}
                    onSuccess={handlePaymentSuccess}
                    onBack={() => setStep(STEPS.FORM)}
                  />
                )}
                {step === STEPS.SELECT && (
                  <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex flex-col items-center justify-center min-h-[280px]">
                    <div className="text-4xl mb-3">💖</div>
                    <p className="text-muted-foreground text-center font-medium text-sm">
                      {bookingType === BOOKING_TYPES.SLOT 
                        ? "Sélectionnez une date et un créneau pour commencer !"
                        : "Sélectionnez une date et une activité à financer !"
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
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

function FundingPicker({ selectedDate, fundings, selectedFunding, onSelectFunding, isLoading }) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedDate) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 text-center">
        <Target className="w-8 h-8 text-pink-400 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Sélectionnez une date pour voir les activités à financer</p>
      </div>
    );
  }

  if (fundings.length === 0) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 text-center">
        <Target className="w-8 h-8 text-pink-400 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Aucune activité à financer pour cette date</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
      <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
        <Target className="w-4 h-4 text-pink-500" />
        Activités à financer
      </h3>
      <div className="space-y-2">
        {fundings.map((funding) => {
          const progress = funding.goal > 0 ? (funding.amount / funding.goal) * 100 : 0;
          const isSelected = selectedFunding?.id === funding.id;
          
          return (
            <button
              key={funding.id}
              onClick={() => onSelectFunding(funding)}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-pink-500 bg-pink-50 dark:bg-pink-950/20"
                  : "border-border hover:border-pink-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{funding.activity_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground">
                      €{funding.amount} / €{funding.goal}
                    </span>
                    <div className="w-20 h-1.5 bg-muted rounded-full">
                      <div 
                        className="h-1.5 bg-pink-500 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-pink-600">
                      {Math.min(progress, 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                {isSelected && (
                  <Badge className="bg-pink-500 text-white">Sélectionné</Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}