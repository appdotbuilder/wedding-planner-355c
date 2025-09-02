import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetItemsTable, vendorsTable } from '../db/schema';
import { type UpdateBudgetItemInput, type CreateBudgetItemInput } from '../schema';
import { updateBudgetItem } from '../handlers/update_budget_item';
import { eq } from 'drizzle-orm';

// Test setup data
const testBudgetItem: CreateBudgetItemInput = {
  category: 'Catering',
  item_name: 'Wedding Cake',
  budgeted_amount: 500.00,
  actual_amount: null,
  vendor_id: null,
  notes: 'Original cake budget'
};

const testVendor = {
  name: 'Sweet Dreams Bakery',
  category: 'Catering',
  contact_person: 'John Baker',
  email: 'john@sweetdreams.com',
  phone: '555-0123',
  website: null,
  address: null,
  service_description: null,
  contract_amount: null,
  deposit_paid: null,
  notes: null
};

describe('updateBudgetItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a budget item', async () => {
    // Create a budget item first
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: null
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      category: 'Updated Catering',
      item_name: 'Premium Wedding Cake',
      budgeted_amount: 750.50,
      actual_amount: 725.25,
      vendor_id: null,
      notes: 'Updated cake budget with premium options'
    };

    const result = await updateBudgetItem(updateInput);

    // Verify all fields are updated
    expect(result.id).toEqual(budgetItemId);
    expect(result.category).toEqual('Updated Catering');
    expect(result.item_name).toEqual('Premium Wedding Cake');
    expect(result.budgeted_amount).toEqual(750.50);
    expect(result.actual_amount).toEqual(725.25);
    expect(result.vendor_id).toBeNull();
    expect(result.notes).toEqual('Updated cake budget with premium options');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric types are correct
    expect(typeof result.budgeted_amount).toBe('number');
    expect(typeof result.actual_amount).toBe('number');
  });

  it('should update only specified fields (partial update)', async () => {
    // Create a budget item first
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: '450.00'
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const partialUpdate: UpdateBudgetItemInput = {
      id: budgetItemId,
      actual_amount: 475.75,
      notes: 'Price increased slightly'
    };

    const result = await updateBudgetItem(partialUpdate);

    // Verify only specified fields are updated
    expect(result.id).toEqual(budgetItemId);
    expect(result.category).toEqual('Catering'); // Original value
    expect(result.item_name).toEqual('Wedding Cake'); // Original value
    expect(result.budgeted_amount).toEqual(500.00); // Original value
    expect(result.actual_amount).toEqual(475.75); // Updated value
    expect(result.vendor_id).toBeNull(); // Original value
    expect(result.notes).toEqual('Price increased slightly'); // Updated value
  });

  it('should update budget item with vendor reference', async () => {
    // Create vendor first
    const vendor = await db.insert(vendorsTable)
      .values({
        ...testVendor,
        contract_amount: null,
        deposit_paid: null
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;

    // Create budget item
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: null
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      vendor_id: vendorId,
      actual_amount: 485.00,
      notes: 'Assigned to Sweet Dreams Bakery'
    };

    const result = await updateBudgetItem(updateInput);

    expect(result.vendor_id).toEqual(vendorId);
    expect(result.actual_amount).toEqual(485.00);
    expect(result.notes).toEqual('Assigned to Sweet Dreams Bakery');
  });

  it('should handle null values correctly', async () => {
    // Create budget item with some values
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: '400.00',
        notes: 'Some notes'
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      actual_amount: null,
      notes: null
    };

    const result = await updateBudgetItem(updateInput);

    expect(result.actual_amount).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should save updates to database correctly', async () => {
    // Create budget item
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: null
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      category: 'Entertainment',
      budgeted_amount: 1200.00,
      actual_amount: 1150.50
    };

    await updateBudgetItem(updateInput);

    // Verify the changes are persisted in database
    const items = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, budgetItemId))
      .execute();

    expect(items).toHaveLength(1);
    expect(items[0].category).toEqual('Entertainment');
    expect(parseFloat(items[0].budgeted_amount)).toEqual(1200.00);
    expect(parseFloat(items[0].actual_amount!)).toEqual(1150.50);
  });

  it('should throw error when budget item not found', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdateBudgetItemInput = {
      id: nonExistentId,
      category: 'Updated Category'
    };

    await expect(updateBudgetItem(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric precision correctly', async () => {
    // Create budget item
    const created = await db.insert(budgetItemsTable)
      .values({
        ...testBudgetItem,
        budgeted_amount: testBudgetItem.budgeted_amount.toString(),
        actual_amount: null
      })
      .returning()
      .execute();

    const budgetItemId = created[0].id;

    const updateInput: UpdateBudgetItemInput = {
      id: budgetItemId,
      budgeted_amount: 999.99,
      actual_amount: 1000.01
    };

    const result = await updateBudgetItem(updateInput);

    expect(result.budgeted_amount).toEqual(999.99);
    expect(result.actual_amount).toEqual(1000.01);
    expect(typeof result.budgeted_amount).toBe('number');
    expect(typeof result.actual_amount).toBe('number');
  });
});