import { db } from '../db';
import { budgetItemsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteBudgetItem = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // First check if the item exists
    const existingItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, input.id))
      .execute();

    if (existingItems.length === 0) {
      return { success: false };
    }

    // Delete the item
    await db.delete(budgetItemsTable)
      .where(eq(budgetItemsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Budget item deletion failed:', error);
    throw error;
  }
};