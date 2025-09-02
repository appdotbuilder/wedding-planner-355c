import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteGuest = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the guest record
    const result = await db.delete(guestsTable)
      .where(eq(guestsTable.id, input.id))
      .execute();

    // Return success status based on whether a record was deleted
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Guest deletion failed:', error);
    throw error;
  }
};