import fs from "fs";
import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import paypal from "@paypal/checkout-server-sdk";
import { db, newId } from "./db.js";
import {
  authMiddleware,
  hashPassword,
  verifyPassword,
  signToken,
} from "./auth.js";
import { sendConfirmationEmail, sendAdminNotificationEmail } from "./email.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3001);

// --- Config PayPal ---
function getPayPalClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const environment =
    process.env.PAYPAL_MODE === "live"
      ? new paypal.core.LiveEnvironment(clientId, clientSecret)
      : new paypal.core.SandboxEnvironment(clientId, clientSecret);
  return new paypal.core.PayPalHttpClient(environment);
}

const app = express();
app.use(cors());
app.use(express.json());

function publicUser(user) {
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

// --- Auth ---

app.post("/api/auth/register", (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Mot de passe trop court (min. 6 caractères)" });
  }

  const data = db.read();
  if (data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet email" });
  }

  const isFirstUser = data.users.length === 0;
  const user = {
    id: newId(),
    email: email.toLowerCase(),
    name: name || email.split("@")[0],
    passwordHash: hashPassword(password),
    role: isFirstUser ? "admin" : "user",
    createdAt: new Date().toISOString(),
  };

  data.users.push(user);
  db.write(data);

  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email et mot de passe requis" });
  }

  const data = db.read();
  const user = data.users.find((u) => u.email === email.toLowerCase());
  if (!user || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const data = db.read();
  const user = data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: "Utilisateur introuvable" });
  res.json(publicUser(user));
});

app.post("/api/auth/forgot-password", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email requis" });

  const data = db.read();
  const user = data.users.find((u) => u.email === email.toLowerCase());

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    data.resetTokens = data.resetTokens.filter((t) => t.userId !== user.id);
    data.resetTokens.push({ userId: user.id, token, expiresAt });
    db.write(data);

    const resetUrl = `${process.env.APP_URL || "http://localhost:5173"}/reset-password?token=${token}`;
    console.log(`[reset-password] Lien pour ${email}: ${resetUrl}`);
  }

  res.json({ ok: true });
});

app.post("/api/auth/reset-password", (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: "Token et mot de passe requis" });
  if (password.length < 6) return res.status(400).json({ error: "Mot de passe trop court" });

  const data = db.read();
  const resetEntry = data.resetTokens.find((t) => t.token === token);

  if (!resetEntry || new Date(resetEntry.expiresAt) < new Date()) {
    return res.status(400).json({ error: "Lien invalide ou expiré" });
  }

  const user = data.users.find((u) => u.id === resetEntry.userId);
  if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });

  user.passwordHash = hashPassword(password);
  data.resetTokens = data.resetTokens.filter((t) => t.token !== token);
  db.write(data);

  res.json({ ok: true });
});

// --- Time Slots ---

app.get("/api/slots", (_req, res) => {
  const data = db.read();
  const slots = [...data.timeSlots].sort((a, b) => {
    return a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
  });
  res.json(slots);
});

app.post("/api/slots", authMiddleware, (req, res) => {
  const { date, time, price, is_booked } = req.body;
  if (!date || !time) {
    return res.status(400).json({ error: "Date et heure requises" });
  }

  const data = db.read();
  if (data.timeSlots.some((s) => s.date === date && s.time === time)) {
    return res.status(409).json({ error: "Ce créneau existe déjà" });
  }

  const slot = {
    id: newId(),
    date,
    time,
    price: parseFloat(price) || 50,
    is_booked: Boolean(is_booked),
    createdAt: new Date().toISOString(),
  };

  data.timeSlots.push(slot);
  db.write(data);
  res.status(201).json(slot);
});

app.post("/api/slots/bulk", authMiddleware, (req, res) => {
  const { date, times, price } = req.body;
  if (!date || !Array.isArray(times) || times.length === 0) {
    return res.status(400).json({ error: "Date et heures requises" });
  }

  const data = db.read();
  const created = [];

  for (const time of times) {
    if (data.timeSlots.some((s) => s.date === date && s.time === time)) continue;
    const slot = {
      id: newId(),
      date,
      time,
      price: parseFloat(price) || 50,
      is_booked: false,
      createdAt: new Date().toISOString(),
    };
    data.timeSlots.push(slot);
    created.push(slot);
  }

  db.write(data);
  res.status(201).json({ created, count: created.length });
});

app.delete("/api/slots/:id", authMiddleware, (req, res) => {
  const data = db.read();
  const slot = data.timeSlots.find((s) => s.id === req.params.id);
  if (!slot) return res.status(404).json({ error: "Créneau introuvable" });
  if (slot.is_booked) {
    return res.status(409).json({ error: "Impossible de supprimer un créneau réservé" });
  }

  data.timeSlots = data.timeSlots.filter((s) => s.id !== req.params.id);
  db.write(data);
  res.json({ ok: true });
});

// --- PayPal Payments ---

// Étape 1 : créer la commande PayPal
app.post("/api/payments/create-order", async (req, res) => {
  const client = getPayPalClient();
  if (!client) {
    return res.status(500).json({ error: "PayPal non configuré (PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET manquants)" });
  }

  const { slotId, clientEmail, clientName } = req.body;
  if (!slotId || !clientEmail || !clientName) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const data = db.read();
  const slot = data.timeSlots.find((s) => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "Créneau introuvable" });
  if (slot.is_booked) return res.status(409).json({ error: "Ce créneau n'est plus disponible" });

  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "EUR",
            value: String((slot.price || 50).toFixed(2)),
          },
          description: `Rendez-vous le ${slot.date} à ${slot.time}`,
          custom_id: JSON.stringify({ slotId, clientEmail, clientName }),
        },
      ],
    });

    const order = await client.execute(request);
    res.json({ orderId: order.result.id });
  } catch (err) {
    console.error("[paypal] Erreur création commande:", err);
    res.status(500).json({ error: err.message || "Erreur PayPal" });
  }
});

// Étape 2 : capturer le paiement et confirmer le RDV
app.post("/api/payments/capture-order", async (req, res) => {
  const client = getPayPalClient();
  if (!client) {
    return res.status(500).json({ error: "PayPal non configuré" });
  }

  const { orderId, notes } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId requis" });

  try {
    const captureRequest = new paypal.orders.OrdersCaptureRequest(orderId);
    captureRequest.requestBody({});
    const capture = await client.execute(captureRequest);

    if (capture.result.status !== "COMPLETED") {
      return res.status(402).json({ error: "Paiement non complété" });
    }

    const unit = capture?.result?.purchase_units?.[0];
    if (!unit) {
      return res.status(500).json({ error: "Réponse PayPal invalide (purchase_units manquant)" });
    }

    // 🔧 CORRECTION : custom_id est dans payments.captures[0]
    const captureData = unit?.payments?.captures?.[0];
    if (!captureData) {
      console.error("[paypal] captureData manquant:", JSON.stringify(capture.result, null, 2));
      return res.status(500).json({ error: "Réponse PayPal invalide (captureData manquant)" });
    }

    if (!captureData.custom_id) {
      console.error("[paypal] custom_id manquant dans la capture:", JSON.stringify(capture.result, null, 2));
      return res.status(500).json({ error: "Réponse PayPal invalide (custom_id manquant)" });
    }

    // Parse custom_id
    const { slotId, clientEmail, clientName } = JSON.parse(captureData.custom_id);
    const amountPaid = parseFloat(captureData?.amount?.value);

    if (!Number.isFinite(amountPaid)) {
      console.error("[paypal] amountPaid invalide:", JSON.stringify(capture.result, null, 2));
      return res.status(500).json({ error: "Réponse PayPal invalide (amount manquant)" });
    }

    const data = db.read();
    const slot = data.timeSlots.find((s) => s.id === slotId);
    if (!slot) return res.status(404).json({ error: "Créneau introuvable" });

    if (slot.is_booked) {
      const existing = data.appointments.find(
        (a) => a.time_slot_id === slotId && a.payment_status === "paid",
      );
      if (existing) return res.json({ appointment: existing });
      return res.status(409).json({ error: "Créneau déjà réservé" });
    }

    const appointment = {
      id: newId(),
      client_name: clientName,
      client_email: clientEmail,
      date: slot.date,
      time: slot.time,
      time_slot_id: slotId,
      amount_paid: amountPaid,
      payment_status: "paid",
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    slot.is_booked = true;
    data.appointments.push(appointment);
    db.write(data);

    // Email au client
    try {
      await sendConfirmationEmail({
        to: clientEmail,
        clientName,
        date: slot.date,
        time: slot.time,
        amountPaid,
        notes: notes || "",
      });
    } catch (emailErr) {
      console.error("[email] Erreur envoi client:", emailErr.message);
    }

    // Email à l'admin
    try {
      await sendAdminNotificationEmail({
        clientName,
        clientEmail,
        date: slot.date,
        time: slot.time,
        amountPaid,
        notes: notes || "",
      });
    } catch (emailErr) {
      console.error("[email] Erreur envoi admin:", emailErr.message);
    }

    res.json({ appointment });
  } catch (err) {
    console.error("[paypal] Erreur capture:", err);
    res.status(500).json({ error: err.message || "Erreur serveur" });
  }
});

// --- Demo booking (sans PayPal) ---

app.post("/api/bookings/demo", async (req, res) => {
  const { slotId, clientName, clientEmail, notes } = req.body;
  if (!slotId || !clientName || !clientEmail) {
    return res.status(400).json({ error: "Paramètres manquants" });
  }

  const data = db.read();
  const slot = data.timeSlots.find((s) => s.id === slotId);
  if (!slot) return res.status(404).json({ error: "Créneau introuvable" });
  if (slot.is_booked) return res.status(409).json({ error: "Créneau déjà réservé" });

  const amountPaid = slot.price || 50;
  const appointment = {
    id: newId(),
    client_name: clientName,
    client_email: clientEmail,
    date: slot.date,
    time: slot.time,
    time_slot_id: slotId,
    amount_paid: amountPaid,
    payment_status: "paid",
    notes: notes || "",
    createdAt: new Date().toISOString(),
  };

  slot.is_booked = true;
  data.appointments.push(appointment);
  db.write(data);

  try {
    await sendConfirmationEmail({
      to: clientEmail,
      clientName,
      date: slot.date,
      time: slot.time,
      amountPaid,
      notes: notes || "",
    });
  } catch (emailErr) {
    console.error("[email] Erreur envoi client:", emailErr.message);
  }

  try {
    await sendAdminNotificationEmail({
      clientName,
      clientEmail,
      date: slot.date,
      time: slot.time,
      amountPaid,
      notes: notes || "",
    });
  } catch (emailErr) {
    console.error("[email] Erreur envoi admin:", emailErr.message);
  }

  res.json({ appointment });
});

// --- Static files in production ---

const distPath = path.join(__dirname, "..", "dist");
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`API disponible sur http://localhost:${PORT}`);
  if (!getPayPalClient()) console.log("⚠ PayPal non configuré — mode démo disponible via /api/bookings/demo");
  if (!process.env.ADMIN_EMAIL) console.log("⚠ ADMIN_EMAIL non défini — notifications admin désactivées");
});