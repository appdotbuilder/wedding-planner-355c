import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vendorsTable, budgetItemsTable, tasksTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';
import { deleteVendor } from '../handlers/delete_vendor';

describe('deleteVendor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a vendor', async () => {
    // Create a test vendor
    const vendor = await db.insert(vendorsTable)
      .values({
        name: 'Test Vendor',
        category: 'Photography',
        contact_person: 'John Doe',
        email: 'john@testvendor.com',
        phone: '+1234567890',
        website: 'https://testvendor.com',
        address: '123 Test St',
        service_description: 'Wedding photography services',
        contract_amount: '2500.00',
        deposit_paid: '500.00',
        notes: 'Test vendor notes'
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;
    const input: DeleteInput = { id: vendorId };

    // Delete the vendor
    const result = await deleteVendor(input);

    expect(result.success).toBe(true);

    // Verify vendor is deleted from database
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(0);
  });

  it('should clean up related budget items when deleting vendor', async () => {
    // Create a test vendor
    const vendor = await db.insert(vendorsTable)
      .values({
        name: 'Photography Vendor',
        category: 'Photography',
        contact_person: 'Jane Smith',
        email: 'jane@photostudio.com',
        phone: '+1234567890'
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;

    // Create budget items linked to this vendor
    await db.insert(budgetItemsTable)
      .values([
        {
          category: 'Photography',
          item_name: 'Wedding Photos',
          budgeted_amount: '2000.00',
          actual_amount: '1800.00',
          vendor_id: vendorId,
          notes: 'Main photography package'
        },
        {
          category: 'Photography',
          item_name: 'Engagement Photos',
          budgeted_amount: '500.00',
          vendor_id: vendorId,
          notes: 'Pre-wedding shoot'
        }
      ])
      .execute();

    const input: DeleteInput = { id: vendorId };

    // Delete the vendor
    const result = await deleteVendor(input);

    expect(result.success).toBe(true);

    // Verify vendor is deleted
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(0);

    // Verify budget items still exist but vendor_id is set to null
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.category, 'Photography'))
      .execute();

    expect(budgetItems).toHaveLength(2);
    budgetItems.forEach(item => {
      expect(item.vendor_id).toBeNull();
    });
  });

  it('should clean up related tasks when deleting vendor', async () => {
    // Create a test vendor
    const vendor = await db.insert(vendorsTable)
      .values({
        name: 'Catering Service',
        category: 'Catering',
        contact_person: 'Chef Bob',
        email: 'bob@catering.com',
        phone: '+1234567890'
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;

    // Create tasks linked to this vendor
    await db.insert(tasksTable)
      .values([
        {
          title: 'Finalize menu',
          description: 'Review and approve final catering menu',
          due_date: new Date('2024-06-01'),
          priority: 'high',
          status: 'pending',
          assigned_to: 'Bride',
          vendor_id: vendorId
        },
        {
          title: 'Taste testing',
          description: 'Schedule food tasting session',
          due_date: new Date('2024-05-15'),
          priority: 'medium',
          status: 'completed',
          assigned_to: 'Couple',
          vendor_id: vendorId
        }
      ])
      .execute();

    const input: DeleteInput = { id: vendorId };

    // Delete the vendor
    const result = await deleteVendor(input);

    expect(result.success).toBe(true);

    // Verify vendor is deleted
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(0);

    // Verify tasks still exist but vendor_id is set to null
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.title, 'Finalize menu'))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].vendor_id).toBeNull();

    const tasks2 = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.title, 'Taste testing'))
      .execute();

    expect(tasks2).toHaveLength(1);
    expect(tasks2[0].vendor_id).toBeNull();
  });

  it('should handle deleting vendor with both budget items and tasks', async () => {
    // Create a test vendor
    const vendor = await db.insert(vendorsTable)
      .values({
        name: 'Full Service Venue',
        category: 'Venue',
        contact_person: 'Event Manager',
        email: 'manager@venue.com',
        phone: '+1234567890',
        contract_amount: '5000.00',
        deposit_paid: '1000.00'
      })
      .returning()
      .execute();

    const vendorId = vendor[0].id;

    // Create both budget items and tasks
    await db.insert(budgetItemsTable)
      .values({
        category: 'Venue',
        item_name: 'Reception Hall Rental',
        budgeted_amount: '5000.00',
        actual_amount: '4800.00',
        vendor_id: vendorId
      })
      .execute();

    await db.insert(tasksTable)
      .values({
        title: 'Venue walkthrough',
        description: 'Final venue inspection before wedding',
        due_date: new Date('2024-07-01'),
        priority: 'high',
        status: 'pending',
        vendor_id: vendorId
      })
      .execute();

    const input: DeleteInput = { id: vendorId };

    // Delete the vendor
    const result = await deleteVendor(input);

    expect(result.success).toBe(true);

    // Verify vendor is deleted
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(0);

    // Verify both budget items and tasks have vendor_id set to null
    const budgetItems = await db.select()
      .from(budgetItemsTable)
      .where(eq(budgetItemsTable.item_name, 'Reception Hall Rental'))
      .execute();

    expect(budgetItems).toHaveLength(1);
    expect(budgetItems[0].vendor_id).toBeNull();

    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.title, 'Venue walkthrough'))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].vendor_id).toBeNull();
  });

  it('should handle deleting non-existent vendor gracefully', async () => {
    const input: DeleteInput = { id: 99999 };

    // Should not throw error even if vendor doesn't exist
    const result = await deleteVendor(input);

    expect(result.success).toBe(true);
  });
});