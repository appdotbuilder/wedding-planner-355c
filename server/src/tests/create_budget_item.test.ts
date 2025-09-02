import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetItemsTable, vendorsTable } from '../db/schema';
import { type CreateBudgetItemInput } from '../schema';
import { createBudgetItem } from '../handlers/create_budget_item';
import { eq } from 'drizzle-orm';

// Simple test input without vendor
const testInput: CreateBudgetItemInput = {
  category: 'Catering',
  item_name: 'Wedding Cake',
  budgeted_amount: 500.50,
  actual_amount: null,
  vendor_id: null,
  notes: 'Three-tier vanilla cake'
};

// Test input with vendor
const testInputWithVendor: CreateBudgetItemInput = {
  category: 'Photography',
  item_name: 'Wedding Photos',
  budgeted_amount: 2500.00,
  actual_amount: 2400.75,
  vendor_id: 1, // Will be created in test
  notes: 'Full day coverage with edited photos'
};

describe('createBudgetItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a budget item without vendor', async () => {
    const result = await createBudgetItem(testInput);

    // Basic field validation
    expect(result.category).toEqual('Catering');
    expect(result.item_name).toEqual('Wedding Cake');
    expect(result.budgeted_amount).toEqual(500.50);
    expect(typeof result.budgeted_amount).toEqual('number');
    expect(result.actual_amount).toBeNull();
    expect(result.vendor_id).toBeNull();
    expect(result.notes).toEqual('Three-tier vanilla cake');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save budget item to database', async () => {
    const result = await createBudgetItem(testInput);

    // Query using proper drizzle syntax
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, result.id))
      .execute();

    expect(budgetItems).toHaveLength(1);
    expect(budgetItems[0].category).toEqual('Catering');
    expect(budgetItems[0].item_name).toEqual('Wedding Cake');
    expect(parseFloat(budgetItems[0].budgeted_amount)).toEqual(500.50);
    expect(budgetItems[0].actual_amount).toBeNull();
    expect(budgetItems[0].vendor_id).toBeNull();
    expect(budgetItems[0].notes).toEqual('Three-tier vanilla cake');
    expect(budgetItems[0].created_at).toBeInstanceOf(Date);
  });

  it('should create a budget item with vendor', async () => {
    // First create a vendor
    const vendor = await db.insert(vendorsTable)
      .values({
        name: 'Best Photos Studio',
        category: 'Photography',
        contact_person: 'John Photographer',
        email: 'john@bestphotos.com',
        phone: '555-0123',
        website: 'https://bestphotos.com',
        address: '123 Camera St',
        service_description: 'Professional wedding photography',
        contract_amount: '2500.00',
        deposit_paid: '500.00',
        notes: 'Highly recommended'
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;

    // Create budget item with vendor
    const inputWithVendor = { ...testInputWithVendor, vendor_id: vendorId };
    const result = await createBudgetItem(inputWithVendor);

    // Validate fields
    expect(result.category).toEqual('Photography');
    expect(result.item_name).toEqual('Wedding Photos');
    expect(result.budgeted_amount).toEqual(2500.00);
    expect(typeof result.budgeted_amount).toEqual('number');
    expect(result.actual_amount).toEqual(2400.75);
    expect(typeof result.actual_amount).toEqual('number');
    expect(result.vendor_id).toEqual(vendorId);
    expect(result.notes).toEqual('Full day coverage with edited photos');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle budget item with zero actual amount', async () => {
    const inputWithZeroActual: CreateBudgetItemInput = {
      category: 'Flowers',
      item_name: 'Bridal Bouquet',
      budgeted_amount: 150.00,
      actual_amount: 0,
      vendor_id: null,
      notes: null
    };

    const result = await createBudgetItem(inputWithZeroActual);

    expect(result.actual_amount).toEqual(0);
    expect(typeof result.actual_amount).toEqual('number');
  });

  it('should throw error when vendor_id is invalid', async () => {
    const inputWithInvalidVendor = { ...testInput, vendor_id: 999 };

    await expect(createBudgetItem(inputWithInvalidVendor))
      .rejects
      .toThrow(/vendor with id 999 not found/i);
  });

  it('should handle large budget amounts correctly', async () => {
    const inputWithLargeAmount: CreateBudgetItemInput = {
      category: 'Venue',
      item_name: 'Reception Hall',
      budgeted_amount: 15000.99,
      actual_amount: 14999.50,
      vendor_id: null,
      notes: 'Prime wedding venue downtown'
    };

    const result = await createBudgetItem(inputWithLargeAmount);

    expect(result.budgeted_amount).toEqual(15000.99);
    expect(result.actual_amount).toEqual(14999.50);
    expect(typeof result.budgeted_amount).toEqual('number');
    expect(typeof result.actual_amount).toEqual('number');

    // Verify in database
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.id, result.id))
      .execute();

    expect(parseFloat(budgetItems[0].budgeted_amount)).toEqual(15000.99);
    expect(parseFloat(budgetItems[0].actual_amount!)).toEqual(14999.50);
  });

  it('should preserve precision for decimal amounts', async () => {
    const inputWithDecimals: CreateBudgetItemInput = {
      category: 'Music',
      item_name: 'DJ Services',
      budgeted_amount: 1234.56,
      actual_amount: 1234.78,
      vendor_id: null,
      notes: 'Evening reception music'
    };

    const result = await createBudgetItem(inputWithDecimals);

    expect(result.budgeted_amount).toEqual(1234.56);
    expect(result.actual_amount).toEqual(1234.78);
  });
});