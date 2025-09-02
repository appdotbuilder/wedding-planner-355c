import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enums for type safety
export const rsvpStatusEnum = pgEnum('rsvp_status', ['pending', 'attending', 'not_attending']);
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const taskStatusEnum = pgEnum('task_status', ['pending', 'in_progress', 'completed']);

// Guests table for guest list management
export const guestsTable = pgTable('guests', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  rsvp_status: rsvpStatusEnum('rsvp_status').notNull().default('pending'),
  meal_choice: text('meal_choice'),
  dietary_restrictions: text('dietary_restrictions'),
  plus_one: boolean('plus_one').notNull().default(false),
  plus_one_name: text('plus_one_name'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Vendors table for vendor management
export const vendorsTable = pgTable('vendors', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  contact_person: text('contact_person'),
  email: text('email'),
  phone: text('phone'),
  website: text('website'),
  address: text('address'),
  service_description: text('service_description'),
  contract_amount: numeric('contract_amount', { precision: 10, scale: 2 }),
  deposit_paid: numeric('deposit_paid', { precision: 10, scale: 2 }),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Budget items table for budget tracking
export const budgetItemsTable = pgTable('budget_items', {
  id: serial('id').primaryKey(),
  category: text('category').notNull(),
  item_name: text('item_name').notNull(),
  budgeted_amount: numeric('budgeted_amount', { precision: 10, scale: 2 }).notNull(),
  actual_amount: numeric('actual_amount', { precision: 10, scale: 2 }),
  vendor_id: integer('vendor_id'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Tasks table for wedding preparation to-do list
export const tasksTable = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  due_date: timestamp('due_date'),
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  status: taskStatusEnum('status').notNull().default('pending'),
  assigned_to: text('assigned_to'),
  vendor_id: integer('vendor_id'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const budgetItemsRelations = relations(budgetItemsTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [budgetItemsTable.vendor_id],
    references: [vendorsTable.id],
  }),
}));

export const tasksRelations = relations(tasksTable, ({ one }) => ({
  vendor: one(vendorsTable, {
    fields: [tasksTable.vendor_id],
    references: [vendorsTable.id],
  }),
}));

export const vendorsRelations = relations(vendorsTable, ({ many }) => ({
  budgetItems: many(budgetItemsTable),
  tasks: many(tasksTable),
}));

// Export all tables for use in drizzle queries
export const tables = {
  guests: guestsTable,
  vendors: vendorsTable,
  budgetItems: budgetItemsTable,
  tasks: tasksTable,
};