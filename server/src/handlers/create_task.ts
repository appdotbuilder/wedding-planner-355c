import { db } from '../db';
import { tasksTable, vendorsTable } from '../db/schema';
import { type CreateTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export const createTask = async (input: CreateTaskInput): Promise<Task> => {
  try {
    // Validate vendor exists if vendor_id is provided
    if (input.vendor_id) {
      const vendor = await db.select()
        .from(vendorsTable)
        .where(eq(vendorsTable.id, input.vendor_id))
        .execute();

      if (vendor.length === 0) {
        throw new Error(`Vendor with id ${input.vendor_id} does not exist`);
      }
    }

    // Insert task record
    const result = await db.insert(tasksTable)
      .values({
        title: input.title,
        description: input.description,
        due_date: input.due_date,
        priority: input.priority,
        status: input.status,
        assigned_to: input.assigned_to,
        vendor_id: input.vendor_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Task creation failed:', error);
    throw error;
  }
};