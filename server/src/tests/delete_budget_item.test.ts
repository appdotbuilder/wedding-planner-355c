import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetItemsTable, vendorsTable } from '../db/schema';
import { type DeleteInput, type CreateBudgetItemInput } from '../schema';
import { deleteBudgetItem } from '../handlers/delete_budget_item';
import { eq } from 'drizzle-orm';

// Test vendor data to create as a prerequisite
const testVendor = {
  name: 'Test Caterer',
  category: 'Catering',
  contact_person: 'John Smith',
  email: 'john@testcaterer.com',
  phone: '555-0123',
  website: 'https://testcaterer.com',
  address: '123 Main St',
  service_description: 'Full-service catering',
  contract_amount: 5000,
  deposit_paid: 2500,
  notes: 'Handles dietary restrictions well'
};

// Test budget item data
const testBudgetItem: CreateBudgetItemInput = {
  category: 'Food & Beverage',
  item_name: 'Wedding Reception Catering',
  budgeted_amount: 4500,
  actual_amount: 4750,
  vendor_id: null, // Will be set after vendor creation
  notes: 'Main reception dinner for 150 guests'
};

describe('deleteBudgetItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing budget item', async () => {
    // Create a budget item to delete
    const budgetResult = await db.insert(budgetItemsTable)
      .values({
        category: testBudgetItem.category,
        item_name: testBudgetItem.item_name,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: testBudgetItem.actual_amount?.toString(),
        vendor_id: testBudgetItem.vendor_id,
        notes: testBudgetItem.notes
      })
      .returning()
      .execute();

    const createdItem = budgetResult[0];
    const deleteInput: DeleteInput = { id: createdItem.id };

    // Delete the budget item
    const result = await deleteBudgetItem(deleteInput);

    expect(result.success).toBe(true);

    // Verify the item was actually deleted
    const remainingItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, createdItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent budget item', async () => {
    const deleteInput: DeleteInput = { id: 99999 }; // Non-existent ID

    const result = await deleteBudgetItem(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should delete budget item with vendor relationship', async () => {
    // Create a vendor first
    const vendorResult = await db.insert(vendorsTable)
      .values({
        ...testVendor,
        contract_amount: testVendor.contract_amount?.toString(),
        deposit_paid: testVendor.deposit_paid?.toString()
      })
      .returning()
      .execute();

    const createdVendor = vendorResult[0];

    // Create a budget item with vendor relationship
    const budgetResult = await db.insert(budgetItemsTable)
      .values({
        category: testBudgetItem.category,
        item_name: testBudgetItem.item_name,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: testBudgetItem.actual_amount?.toString(),
        vendor_id: createdVendor.id,
        notes: testBudgetItem.notes
      })
      .returning()
      .execute();

    const createdItem = budgetResult[0];
    const deleteInput: DeleteInput = { id: createdItem.id };

    // Delete the budget item
    const result = await deleteBudgetItem(deleteInput);

    expect(result.success).toBe(true);

    // Verify the budget item was deleted
    const remainingItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, createdItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);

    // Verify the vendor still exists (should not cascade delete)
    const remainingVendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, createdVendor.id))
      .execute();

    expect(remainingVendors).toHaveLength(1);
  });

  it('should handle multiple budget items correctly', async () => {
    // Create multiple budget items
    const item1Result = await db.insert(budgetItemsTable)
      .values({
        category: 'Flowers',
        item_name: 'Bridal Bouquet',
        budgeted_amount: '300',
        actual_amount: null,
        vendor_id: null,
        notes: null
      })
      .returning()
      .execute();

    const item2Result = await db.insert(budgetItemsTable)
      .values({
        category: 'Music',
        item_name: 'DJ Services',
        budgeted_amount: '800',
        actual_amount: '750',
        vendor_id: null,
        notes: 'Includes sound equipment'
      })
      .returning()
      .execute();

    const item1 = item1Result[0];
    const item2 = item2Result[0];

    // Delete only the first item
    const deleteInput: DeleteInput = { id: item1.id };
    const result = await deleteBudgetItem(deleteInput);

    expect(result.success).toBe(true);

    // Verify only the first item was deleted
    const remainingItem1 = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, item1.id))
      .execute();

    const remainingItem2 = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, item2.id))
      .execute();

    expect(remainingItem1).toHaveLength(0);
    expect(remainingItem2).toHaveLength(1);
    expect(remainingItem2[0].item_name).toEqual('DJ Services');
  });
});