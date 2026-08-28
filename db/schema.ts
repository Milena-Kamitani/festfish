import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const residents = sqliteTable("residents", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	registrationNumber: text("registration_number").notNull().unique(),
	fullName: text("full_name").notNull(),
	cpf: text("cpf").notNull().unique(),
	birthDate: text("birth_date").notNull(),
	phone: text("phone").notNull(),
	address: text("address").notNull(),
	status: text("status").notNull().default("pending"),
	facialReferenceKey: text("facial_reference_key"),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
	updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const proofDocuments = sqliteTable("proof_documents", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	residentId: integer("resident_id").notNull().references(() => residents.id),
	bondType: text("bond_type").notNull(),
	storageKey: text("storage_key").notNull(),
	originalName: text("original_name").notNull(),
	status: text("status").notNull().default("pending"),
	uploadedAt: text("uploaded_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const validations = sqliteTable("validations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	residentId: integer("resident_id").notNull().references(() => residents.id),
	documentId: integer("document_id").references(() => proofDocuments.id),
	validatorId: integer("validator_id").notNull(),
	decision: text("decision").notNull(),
	notes: text("notes").notNull().default(""),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const events = sqliteTable("events", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	code: text("code").notNull().unique(),
	name: text("name").notNull(),
	eventDate: text("event_date").notNull(),
	status: text("status").notNull().default("planned"),
});

export const invitations = sqliteTable("invitations", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	residentId: integer("resident_id").notNull().references(() => residents.id),
	eventId: integer("event_id").notNull().references(() => events.id),
	status: text("status").notNull().default("not_delivered"),
	deliveredAt: text("delivered_at"),
});

export const checkins = sqliteTable("checkins", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	checkinNumber: text("checkin_number").notNull().unique(),
	residentId: integer("resident_id").notNull().references(() => residents.id),
	eventId: integer("event_id").notNull().references(() => events.id),
	method: text("method").notNull(),
	similarityScore: integer("similarity_score"),
	operatorId: integer("operator_id").notNull(),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	fullName: text("full_name").notNull(),
	email: text("email").notNull().unique(),
	role: text("role").notNull(),
	department: text("department"),
	active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const auditLog = sqliteTable("audit_log", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	userId: integer("user_id").references(() => users.id),
	action: text("action").notNull(),
	entityType: text("entity_type").notNull(),
	entityId: integer("entity_id"),
	details: text("details").notNull().default(""),
	createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
