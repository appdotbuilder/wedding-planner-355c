import { z } from 'zod';

// Guest schema with RSVP tracking and meal choices
export const guestSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']),
  meal_choice: z.string().nullable(),
  dietary_restrictions: z.string().nullable(),
  plus_one: z.boolean(),
  plus_one_name: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Guest = z.infer<typeof guestSchema>;

// Input schema for creating guests
export const createGuestInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']).default('pending'),
  meal_choice: z.string().nullable(),
  dietary_restrictions: z.string().nullable(),
  plus_one: z.boolean().default(false),
  plus_one_name: z.string().nullable(),
  notes: z.string().nullable()
});

export type CreateGuestInput = z.infer<typeof createGuestInputSchema>;

// Input schema for updating guests
export const updateGuestInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  rsvp_status: z.enum(['pending', 'attending', 'not_attending']).optional(),
  meal_choice: z.string().nullable().optional(),
  dietary_restrictions: z.string().nullable().optional(),
  plus_one: z.boolean().optional(),
  plus_one_name: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateGuestInput = z.infer<typeof updateGuestInputSchema>;

// Budget schema for tracking wedding expenses
export const budgetItemSchema = z.object({
  id: z.number(),
  category: z.string(),
  item_name: z.string(),
  budgeted_amount: z.number(),
  actual_amount: z.number().nullable(),
  vendor_id: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type BudgetItem = z.infer<typeof budgetItemSchema>;

// Input schema for creating budget items
export const createBudgetItemInputSchema = z.object({
  category: z.string().min(1),
  item_name: z.string().min(1),
  budgeted_amount: z.number().positive(),
  actual_amount: z.number().nullable(),
  vendor_id: z.number().nullable(),
  notes: z.string().nullable()
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemInputSchema>;

// Input schema for updating budget items
export const updateBudgetItemInputSchema = z.object({
  id: z.number(),
  category: z.string().min(1).optional(),
  item_name: z.string().min(1).optional(),
  budgeted_amount: z.number().positive().optional(),
  actual_amount: z.number().nullable().optional(),
  vendor_id: z.number().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemInputSchema>;

// Task schema for wedding preparations
export const taskSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['pending', 'in_progress', 'completed']),
  assigned_to: z.string().nullable(),
  vendor_id: z.number().nullable(),
  created_at: z.coerce.date()
});

export type Task = z.infer<typeof taskSchema>;

// Input schema for creating tasks
export const createTaskInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  due_date: z.coerce.date().nullable(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assigned_to: z.string().nullable(),
  vendor_id: z.number().nullable()
});

export type CreateTaskInput = z.infer<typeof createTaskInputSchema>;

// Input schema for updating tasks
export const updateTaskInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  due_date: z.coerce.date().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  assigned_to: z.string().nullable().optional(),
  vendor_id: z.number().nullable().optional()
});

export type UpdateTaskInput = z.infer<typeof updateTaskInputSchema>;

// Vendor schema for managing wedding vendors
export const vendorSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  contact_person: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  service_description: z.string().nullable(),
  contract_amount: z.number().nullable(),
  deposit_paid: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Vendor = z.infer<typeof vendorSchema>;

// Input schema for creating vendors
export const createVendorInputSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  contact_person: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  address: z.string().nullable(),
  service_description: z.string().nullable(),
  contract_amount: z.number().nullable(),
  deposit_paid: z.number().nullable(),
  notes: z.string().nullable()
});

export type CreateVendorInput = z.infer<typeof createVendorInputSchema>;

// Input schema for updating vendors
export const updateVendorInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  contact_person: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  service_description: z.string().nullable().optional(),
  contract_amount: z.number().nullable().optional(),
  deposit_paid: z.number().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateVendorInput = z.infer<typeof updateVendorInputSchema>;

// ID schema for delete operations
export const deleteInputSchema = z.object({
  id: z.number()
});

export type DeleteInput = z.infer<typeof deleteInputSchema>;