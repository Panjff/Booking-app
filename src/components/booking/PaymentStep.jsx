import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

import { api } from "@/api/client";

const isPayPalConfigured = Boolean(import.meta.env.VITE_PAYPAL_CLIENT_ID);

function PayPalCheckoutForm({ item, clientInfo, bookingType, onSuccess }) {
  const [error, setError] = useState(null);

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", color: "gold" }}
        createOrder={async () => {
          setError(null);
          try {
            const res = await api.payments.createOrder({
              slotId: bookingType === "slot" ? item.id : undefined,
              fundingId: bookingType === "funding" ? item.id : undefined,
              clientEmail: clientInfo.email,
              clientName: clientInfo.name,
            });
            return res.orderId;
          } catch (err) {
            setError(err.message || "Impossible de créer la commande PayPal");
            throw err;
          }
        }}
        onApprove={async (data) => {
          try {
            const result = await api.payments.captureOrder({
              orderId: data.orderID,
              notes: clientInfo.notes || "",
            });
            onSuccess(result.appointment);
          } catch (err) {
            setError(err.message || "Erreur lors de la confirmation du rendez-vous");
          }
        }}
        onError={(err) => {
          console.error("[paypal]", err);
          setError("Une erreur PayPal est survenue. Veuillez réessayer.");
        }}
        onCancel={() => {
          setError("Paiement annulé.");
        }}
      />

      <p className="text-xs text-center text-muted-foreground">
        {bookingType === "funding" ? "Soutien sécurisé par PayPal" : "Paiement sécurisé par PayPal"}
      </p>
    </div>
  );
}

function DemoPaymentForm({ item, clientInfo, bookingType, onSuccess, onBack }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleDemoPay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await api.bookings.demo({
        slotId: item.id,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        notes: clientInfo.notes || "",
      });
      onSuccess(result.appointment);
    } catch (err) {
      setError(err.message || "Erreur lors de la réservation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        {bookingType === "funding"
          ? "Mode démo — PayPal non configuré. Le soutien sera enregistré sans paiement réel."
          : "Mode démo — PayPal non configuré. La réservation sera confirmée sans paiement réel."}
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <Button
        onClick={handleDemoPay}
        disabled={isProcessing}
        className="w-full rounded-xl font-bold text-base h-12 shadow-lg shadow-primary/20"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Confirmation...
          </>
        ) : (
          bookingType === "funding" ? "Confirmer le soutien (démo)" : "Confirmer la réservation (démo)"
        )}
      </Button>
      <Button variant="ghost" onClick={onBack} className="w-full rounded-xl">
        Retour
      </Button>
    </div>
  );
}

export default function PaymentStep({ slot, funding, clientInfo, bookingType = "slot", onSuccess, onBack }) {
  const item = bookingType === "funding" ? funding : slot;
  const amount = item?.price || item?.goal || 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-card rounded-2xl shadow-sm border border-border p-5 md:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-8 w-8">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-base font-bold font-heading text-foreground">
          {bookingType === "funding" ? "Soutien 💳" : "Paiement 💳"}
        </h3>
      </div>

      <div className="bg-accent/60 rounded-xl p-4 mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            {bookingType === "funding" ? "Activité soutenue" : "Rendez-vous"}
          </span>
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        {bookingType === "funding" ? (
          <>
            <p className="font-bold text-foreground">{item?.activity_name}</p>
            <p className="text-sm text-muted-foreground">
              {item?.date
                ? format(new Date(item.date + "T12:00:00"), "d MMMM yyyy", { locale: fr })
                : "Disponible immédiatement"}
            </p>
          </>
        ) : (
          <>
            <p className="font-bold text-foreground">
              {format(new Date(item.date + "T12:00:00"), "d MMMM yyyy", { locale: fr })}
            </p>
            <p className="text-sm text-muted-foreground">{item.time}</p>
          </>
        )}
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
          <span className="font-semibold text-foreground">
            {bookingType === "funding" ? "Montant actuel" : "Total"}
          </span>
          <span className="text-xl font-extrabold text-primary">€{amount}</span>
        </div>
      </div>

      {isPayPalConfigured ? (
        <PayPalScriptProvider
          options={{
            clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
            currency: "EUR",
          }}
        >
          <PayPalCheckoutForm
            item={item}
            clientInfo={clientInfo}
            bookingType={bookingType}
            onSuccess={onSuccess}
          />
        </PayPalScriptProvider>
      ) : (
        <DemoPaymentForm
          item={item}
          clientInfo={clientInfo}
          bookingType={bookingType}
          onSuccess={onSuccess}
          onBack={onBack}
        />
      )}
    </motion.div>
  );
}
