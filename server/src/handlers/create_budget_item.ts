import { db } from '../db';
import { budgetItemsTable, vendorsTable } from '../db/schema';
import { type CreateBudgetItemInput, type BudgetItem } from '../schema';
import { eq } from 'drizzle-orm';

export const createBudgetItem = async (input: CreateBudgetItemInput): Promise<BudgetItem> => {
  try {
    // Validate vendor exists if vendor_id is provided
    if (input.vendor_id) {
      const vendor = await db.select()
        .from(vendorsTable)
        .where(eq(vendorsTable.id, input.vendor_id))
        .execute();

      if (vendor.length === 0) {
        throw new Error(`Vendor with id ${input.vendor_id} not found`);
      }
    }

    // Insert budget item record
    const result = await db.insert(budgetItemsTable)
      .values({
        category: input.category,
        item_name: input.item_name,
        budgeted_amount: input.budgeted_amount.toString(), // Convert number to string for numeric column
        actual_amount: input.actual_amount?.toString() || null, // Convert number to string if provided
        vendor_id: input.vendor_id,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const budgetItem = result[0];
    return {
      ...budgetItem,
      budgeted_amount: parseFloat(budgetItem.budgeted_amount), // Convert string back to number
      actual_amount: budgetItem.actual_amount ? parseFloat(budgetItem.actual_amount) : null // Convert string back to number if not null
    };
  } catch (error) {
    console.error('Budget item creation failed:', error);
    throw error;
  }
};