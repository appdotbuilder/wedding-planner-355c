import { db } from '../db';
import { budgetItemsTable } from '../db/schema';
import { type UpdateBudgetItemInput, type BudgetItem } from '../schema';
import { eq } from 'drizzle-orm';

export const updateBudgetItem = async (input: UpdateBudgetItemInput): Promise<BudgetItem> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.item_name !== undefined) {
      updateData.item_name = input.item_name;
    }
    if (input.budgeted_amount !== undefined) {
      updateData.budgeted_amount = input.budgeted_amount.toString();
    }
    if (input.actual_amount !== undefined) {
      updateData.actual_amount = input.actual_amount?.toString() || null;
    }
    if (input.vendor_id !== undefined) {
      updateData.vendor_id = input.vendor_id;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Update the budget item
    const result = await db.update(budgetItemsTable)
      .set(updateData)
      .where(eq(budgetItemsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Budget item with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const budgetItem = result[0];
    return {
      ...budgetItem,
      budgeted_amount: parseFloat(budgetItem.budgeted_amount),
      actual_amount: budgetItem.actual_amount ? parseFloat(budgetItem.actual_amount) : null
    };
  } catch (error) {
    console.error('Budget item update failed:', error);
    throw error;
  }
};