import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { budgetItemsTable, vendorsTable } from '../db/schema';
import { getBudgetItems } from '../handlers/get_budget_items';

describe('getBudgetItems', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no budget items exist', async () => {
    const result = await getBudgetItems();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all budget items with correct field types', async () => {
    // Create a vendor first for foreign key reference
    const vendorResult = await db.insert(vendorsTable)
      .values({
        name: 'Test Vendor',
        category: 'Photography',
        contact_person: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        contract_amount: '1500.00',
        deposit_paid: '500.00'
      })
      .returning()
      .execute();

    const vendorId = vendorResult[0].id;

    // Insert test budget items
    await db.insert(budgetItemsTable)
      .values([
        {
          category: 'Photography',
          item_name: 'Wedding Photos',
          budgeted_amount: '1500.00',
          actual_amount: '1400.00',
          vendor_id: vendorId,
          notes: 'Engagement and wedding photos'
        },
        {
          category: 'Catering',
          item_name: 'Reception Dinner',
          budgeted_amount: '5000.00',
          actual_amount: null,
          vendor_id: null,
          notes: 'For 100 guests'
        },
        {
          category: 'Venue',
          item_name: 'Reception Hall',
          budgeted_amount: '2500.00',
          actual_amount: '2600.00',
          vendor_id: null,
          notes: null
        }
      ])
      .execute();

    const result = await getBudgetItems();

    // Should return all 3 items
    expect(result).toHaveLength(3);

    // Check that numeric conversions are correct
    result.forEach(item => {
      expect(typeof item.budgeted_amount).toBe('number');
      expect(item.budgeted_amount).toBeGreaterThan(0);
      
      if (item.actual_amount !== null) {
        expect(typeof item.actual_amount).toBe('number');
      }
      
      expect(typeof item.id).toBe('number');
      expect(item.created_at).toBeInstanceOf(Date);
    });

    // Verify specific data
    const photographyItem = result.find(item => item.category === 'Photography');
    expect(photographyItem).toBeDefined();
    expect(photographyItem!.item_name).toEqual('Wedding Photos');
    expect(photographyItem!.budgeted_amount).toEqual(1500);
    expect(photographyItem!.actual_amount).toEqual(1400);
    expect(photographyItem!.vendor_id).toEqual(vendorId);
    expect(photographyItem!.notes).toEqual('Engagement and wedding photos');

    const cateringItem = result.find(item => item.category === 'Catering');
    expect(cateringItem).toBeDefined();
    expect(cateringItem!.budgeted_amount).toEqual(5000);
    expect(cateringItem!.actual_amount).toBeNull();
    expect(cateringItem!.vendor_id).toBeNull();

    const venueItem = result.find(item => item.category === 'Venue');
    expect(venueItem).toBeDefined();
    expect(venueItem!.budgeted_amount).toEqual(2500);
    expect(venueItem!.actual_amount).toEqual(2600);
    expect(venueItem!.notes).toBeNull();
  });

  it('should handle decimal amounts correctly', async () => {
    // Insert budget item with decimal amounts
    await db.insert(budgetItemsTable)
      .values({
        category: 'Flowers',
        item_name: 'Bridal Bouquet',
        budgeted_amount: '125.50',
        actual_amount: '130.75',
        vendor_id: null,
        notes: 'White roses and baby breath'
      })
      .execute();

    const result = await getBudgetItems();

    expect(result).toHaveLength(1);
    expect(result[0].budgeted_amount).toEqual(125.5);
    expect(result[0].actual_amount).toEqual(130.75);
  });

  it('should maintain data integrity with multiple items', async () => {
    // Create multiple vendors
    const vendor1 = await db.insert(vendorsTable)
      .values({
        name: 'Vendor One',
        category: 'Photography'
      })
      .returning()
      .execute();

    const vendor2 = await db.insert(vendorsTable)
      .values({
        name: 'Vendor Two',
        category: 'Catering'
      })
      .returning()
      .execute();

    // Insert budget items with different vendors
    await db.insert(budgetItemsTable)
      .values([
        {
          category: 'Photography',
          item_name: 'Wedding Photos',
          budgeted_amount: '1000.00',
          actual_amount: '950.00',
          vendor_id: vendor1[0].id
        },
        {
          category: 'Catering',
          item_name: 'Appetizers',
          budgeted_amount: '800.00',
          actual_amount: null,
          vendor_id: vendor2[0].id
        },
        {
          category: 'Miscellaneous',
          item_name: 'Wedding Favors',
          budgeted_amount: '300.00',
          actual_amount: '275.50',
          vendor_id: null
        }
      ])
      .execute();

    const result = await getBudgetItems();

    expect(result).toHaveLength(3);

    // Verify vendor associations
    const photoItem = result.find(item => item.category === 'Photography');
    expect(photoItem!.vendor_id).toEqual(vendor1[0].id);

    const cateringItem = result.find(item => item.category === 'Catering');
    expect(cateringItem!.vendor_id).toEqual(vendor2[0].id);

    const miscItem = result.find(item => item.category === 'Miscellaneous');
    expect(miscItem!.vendor_id).toBeNull();

    // Verify all amounts are numbers
    const totalBudgeted = result.reduce((sum, item) => sum + item.budgeted_amount, 0);
    expect(totalBudgeted).toEqual(2100);

    const totalActual = result.reduce((sum, item) => {
      return sum + (item.actual_amount || 0);
    }, 0);
    expect(totalActual).toEqual(1225.5);
  });
});