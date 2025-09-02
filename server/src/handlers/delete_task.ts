import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTask = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the task record
    const result = await db.delete(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return success status based on whether any rows were affected
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Task deletion failed:', error);
    throw error;
  }
};