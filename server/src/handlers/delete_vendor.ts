import { db } from '../db';
import { vendorsTable, budgetItemsTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export const deleteVendor = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // First, update related budget items to remove vendor reference
    await db.update(budgetItemsTable)
      .set({ vendor_id: null })
      .where(eq(budgetItemsTable.vendor_id, input.id))
      .execute();

    // Update related tasks to remove vendor reference
    await db.update(tasksTable)
      .set({ vendor_id: null })
      .where(eq(tasksTable.vendor_id, input.id))
      .execute();

    // Finally, delete the vendor
    const result = await db.delete(vendorsTable)
      .where(eq(vendorsTable.id, input.id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Vendor deletion failed:', error);
    throw error;
  }
};