export async function sendConfirmationEmail({ to, clientName, date, time, amountPaid, notes }) {
  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    console.log(`[email] Confirmation client pour ${to} — ${date} ${time} (SMTP non configuré)`);
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "✅ Votre rendez-vous est confirmé !",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 16px;">
        <h1 style="color: #111827; text-align: center; font-size: 22px;">Rendez-vous confirmé 🎉</h1>
        <div style="background: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #e5e7eb;">
          <p style="margin: 8px 0;"><strong>Nom :</strong> ${clientName}</p>
          <p style="margin: 8px 0;"><strong>Date :</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>Heure :</strong> ${time}</p>
          <p style="margin: 8px 0;"><strong>Montant payé :</strong> €${amountPaid}</p>
          ${notes ? `<p style="margin: 8px 0;"><strong>Notes :</strong> ${notes}</p>` : ""}
        </div>
        <p style="text-align: center; color: #6b7280; margin-top: 20px; font-size: 14px;">
          Merci pour votre réservation ! À bientôt.
        </p>
      </div>
    `,
  });
}

export async function sendAdminNotificationEmail({ clientName, clientEmail, date, time, amountPaid, notes }) {
  const smtpHost = process.env.SMTP_HOST;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!smtpHost || !adminEmail) {
    console.log(`[email] Notification admin — Nouveau RDV : ${clientName} (${clientEmail}) le ${date} à ${time} (SMTP/ADMIN_EMAIL non configuré)`);
    return;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: adminEmail,
    subject: `📅 Nouveau rendez-vous — ${clientName} le ${date} à ${time}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9fafb; padding: 32px; border-radius: 16px;">
        <h1 style="color: #111827; font-size: 20px;">📅 Nouveau rendez-vous reçu</h1>
        <div style="background: white; padding: 24px; border-radius: 12px; margin-top: 16px; border: 1px solid #e5e7eb;">
          <p style="margin: 8px 0;"><strong>Client :</strong> ${clientName}</p>
          <p style="margin: 8px 0;"><strong>Email :</strong> <a href="mailto:${clientEmail}">${clientEmail}</a></p>
          <p style="margin: 8px 0;"><strong>Date :</strong> ${date}</p>
          <p style="margin: 8px 0;"><strong>Heure :</strong> ${time}</p>
          <p style="margin: 8px 0;"><strong>Montant :</strong> €${amountPaid}</p>
          ${notes ? `<p style="margin: 8px 0;"><strong>Notes :</strong> ${notes}</p>` : ""}
        </div>
        <p style="color: #6b7280; margin-top: 20px; font-size: 13px;">
          Ce message est envoyé automatiquement depuis votre application de réservation.
        </p>
      </div>
    `,
  });
}
