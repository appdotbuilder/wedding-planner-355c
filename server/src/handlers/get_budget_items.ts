import { db } from '../db';
import { budgetItemsTable } from '../db/schema';
import { type BudgetItem } from '../schema';

export const getBudgetItems = async (): Promise<BudgetItem[]> => {
  try {
    // Fetch all budget items from the database
    const results = await db.select()
      .from(budgetItemsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(item => ({
      ...item,
      budgeted_amount: parseFloat(item.budgeted_amount),
      actual_amount: item.actual_amount ? parseFloat(item.actual_amount) : null
    }));
  } catch (error) {
    console.error('Failed to fetch budget items:', error);
    throw error;
  }
};