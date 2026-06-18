import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const JSON_DB_PATH = path.join(DATA_DIR, "db.json");
const SQLITE_DB_PATH = path.join(DATA_DIR, "db.sqlite");

const defaultDb = () => ({
  users: [],
  timeSlots: [],
  appointments: [],
  resetTokens: [],
  fundings: [],
});

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

ensureDataDir();

const sqlite = new Database(SQLITE_DB_PATH);

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timeSlots (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      price REAL NOT NULL,
      is_booked INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_email TEXT NOT NULL,
      date TEXT,
      time TEXT,
      time_slot_id TEXT,
      amount_paid REAL NOT NULL,
      payment_status TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      funding_id TEXT,
      activity_name TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resetTokens (
      userId TEXT NOT NULL,
      token TEXT NOT NULL PRIMARY KEY,
      expiresAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fundings (
      id TEXT PRIMARY KEY,
      activity_name TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      goal REAL NOT NULL,
      is_funded INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);
}

function tableCount(tableName) {
  return sqlite.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;
}

function migrateJsonIfNeeded() {
  const hasExistingData =
    tableCount("users") > 0 ||
    tableCount("timeSlots") > 0 ||
    tableCount("appointments") > 0 ||
    tableCount("resetTokens") > 0;

  if (hasExistingData || !fs.existsSync(JSON_DB_PATH)) {
    return;
  }

  const parsed = {
    ...defaultDb(),
    ...JSON.parse(fs.readFileSync(JSON_DB_PATH, "utf-8")),
  };

  const insertUser = sqlite.prepare(`
    INSERT INTO users (id, email, name, passwordHash, role, createdAt)
    VALUES (@id, @email, @name, @passwordHash, @role, @createdAt)
  `);
  const insertTimeSlot = sqlite.prepare(`
    INSERT INTO timeSlots (id, date, time, price, is_booked, createdAt)
    VALUES (@id, @date, @time, @price, @is_booked, @createdAt)
  `);
  const insertAppointment = sqlite.prepare(`
    INSERT INTO appointments (
      id, client_name, client_email, date, time, time_slot_id,
      amount_paid, payment_status, notes, funding_id, activity_name, createdAt
    )
    VALUES (
      @id, @client_name, @client_email, @date, @time, @time_slot_id,
      @amount_paid, @payment_status, @notes, @funding_id, @activity_name, @createdAt
    )
  `);
  const insertResetToken = sqlite.prepare(`
    INSERT INTO resetTokens (userId, token, expiresAt)
    VALUES (@userId, @token, @expiresAt)
  `);

  const migrate = sqlite.transaction(() => {
    for (const user of parsed.users) {
      insertUser.run(user);
    }
    for (const slot of parsed.timeSlots) {
      insertTimeSlot.run({
        ...slot,
        price: Number(slot.price) || 0,
        is_booked: slot.is_booked ? 1 : 0,
      });
    }
    for (const appointment of parsed.appointments) {
      insertAppointment.run({
        date: null,
        time: null,
        time_slot_id: null,
        notes: "",
        funding_id: null,
        activity_name: null,
        ...appointment,
        amount_paid: Number(appointment.amount_paid) || 0,
        notes: appointment.notes || "",
      });
    }
    for (const resetToken of parsed.resetTokens) {
      insertResetToken.run(resetToken);
    }
  });

  migrate();
}

function mapRows() {
  return {
    users: sqlite.prepare("SELECT * FROM users").all(),
    timeSlots: sqlite.prepare("SELECT * FROM timeSlots").all().map((slot) => ({
      ...slot,
      is_booked: Boolean(slot.is_booked),
    })),
    appointments: sqlite.prepare("SELECT * FROM appointments").all(),
    resetTokens: sqlite.prepare("SELECT * FROM resetTokens").all(),
    fundings: sqlite.prepare("SELECT * FROM fundings").all().map((f) => ({
      ...f,
      is_funded: Boolean(f.is_funded),
    })),
  };
}

function replaceTable(tableName, rows, insertStatement, normalizeRow = (row) => row) {
  sqlite.prepare(`DELETE FROM ${tableName}`).run();
  for (const row of rows) {
    insertStatement.run(normalizeRow(row));
  }
}

function readDb() {
  return mapRows();
}

function writeDb(data) {
  const nextData = {
    ...defaultDb(),
    ...data,
  };

  const insertUser = sqlite.prepare(`
    INSERT INTO users (id, email, name, passwordHash, role, createdAt)
    VALUES (@id, @email, @name, @passwordHash, @role, @createdAt)
  `);
  const insertTimeSlot = sqlite.prepare(`
    INSERT INTO timeSlots (id, date, time, price, is_booked, createdAt)
    VALUES (@id, @date, @time, @price, @is_booked, @createdAt)
  `);
  const insertAppointment = sqlite.prepare(`
    INSERT INTO appointments (
      id, client_name, client_email, date, time, time_slot_id,
      amount_paid, payment_status, notes, funding_id, activity_name, createdAt
    )
    VALUES (
      @id, @client_name, @client_email, @date, @time, @time_slot_id,
      @amount_paid, @payment_status, @notes, @funding_id, @activity_name, @createdAt
    )
  `);
  const insertResetToken = sqlite.prepare(`
    INSERT INTO resetTokens (userId, token, expiresAt)
    VALUES (@userId, @token, @expiresAt)
  `);
  const insertFunding = sqlite.prepare(`
    INSERT INTO fundings (id, activity_name, amount, goal, is_funded, createdAt)
    VALUES (@id, @activity_name, @amount, @goal, @is_funded, @createdAt)
  `);

  const persist = sqlite.transaction(() => {
    replaceTable("users", nextData.users, insertUser);
    replaceTable("timeSlots", nextData.timeSlots, insertTimeSlot, (slot) => ({
      ...slot,
      price: Number(slot.price) || 0,
      is_booked: slot.is_booked ? 1 : 0,
    }));
    replaceTable("appointments", nextData.appointments, insertAppointment, (appointment) => ({
      date: null,
      time: null,
      time_slot_id: null,
      notes: "",
      funding_id: null,
      activity_name: null,
      ...appointment,
      amount_paid: Number(appointment.amount_paid) || 0,
      notes: appointment.notes || "",
    }));
    replaceTable("resetTokens", nextData.resetTokens, insertResetToken);
    replaceTable("fundings", nextData.fundings || [], insertFunding, (f) => ({
      ...f,
      amount: Number(f.amount) || 0,
      goal: Number(f.goal) || 0,
      is_funded: f.is_funded ? 1 : 0,
    }));
  });

  persist();
}

function seedAdminIfNeeded() {
  const adminExists = sqlite.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'admin'").get().count > 0;
  if (adminExists) return;

  const adminEmail = process.env.ADMIN_EMAIL || "emilie.tall@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "Mytime2026";

  sqlite.prepare(`
    INSERT INTO users (id, email, name, passwordHash, role, createdAt)
    VALUES (@id, @email, @name, @passwordHash, @role, @createdAt)
  `).run({
    id: crypto.randomUUID(),
    email: adminEmail,
    name: adminEmail.split("@")[0],
    passwordHash: bcrypt.hashSync(adminPassword, 10),
    role: "admin",
    createdAt: new Date().toISOString(),
  });

  console.log(`[seed] Compte admin créé : ${adminEmail}`);
}

createTables();
migrateJsonIfNeeded();
seedAdminIfNeeded();

export function newId() {
  return crypto.randomUUID();
}

export const db = {
  read: readDb,
  write: writeDb,
  transaction(fn) {
    return sqlite.transaction(() => {
      const data = readDb();
      const result = fn(data);
      writeDb(data);
      return result;
    })();
  },
};