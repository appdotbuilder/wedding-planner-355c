import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, vendorsTable } from '../db/schema';
import { type DeleteInput, type CreateTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test input for creating tasks
const testTaskInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing deletion',
  due_date: new Date('2024-12-31'),
  priority: 'high',
  status: 'pending',
  assigned_to: 'Test Person',
  vendor_id: null
};

// Test input with vendor reference
const testTaskWithVendorInput: CreateTaskInput = {
  title: 'Vendor Task',
  description: 'A task with vendor reference',
  due_date: new Date('2024-12-31'),
  priority: 'medium',
  status: 'in_progress',
  assigned_to: 'Coordinator',
  vendor_id: 1 // Will be set after creating vendor
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task', async () => {
    // Create a task first
    const insertResult = await db.insert(tasksTable)
      .values({
        title: testTaskInput.title,
        description: testTaskInput.description,
        due_date: testTaskInput.due_date,
        priority: testTaskInput.priority,
        status: testTaskInput.status,
        assigned_to: testTaskInput.assigned_to,
        vendor_id: testTaskInput.vendor_id
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Delete the task
    const deleteInput: DeleteInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify task is deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when deleting non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const deleteInput: DeleteInput = { id: 999 };
    const result = await deleteTask(deleteInput);

    // Should return false since no rows were affected
    expect(result.success).toBe(false);
  });

  it('should delete task with vendor reference', async () => {
    // First create a vendor
    const vendorResult = await db.insert(vendorsTable)
      .values({
        name: 'Test Vendor',
        category: 'Photography',
        contact_person: 'John Photographer',
        email: 'john@photography.com',
        phone: '555-0123',
        website: 'https://photography.com',
        address: '123 Photo St',
        service_description: 'Wedding photography services',
        contract_amount: '2500.00',
        deposit_paid: '500.00',
        notes: 'Preferred photographer'
      })
      .returning()
      .execute();

    const vendorId = vendorResult[0].id;

    // Create a task with vendor reference
    const taskResult = await db.insert(tasksTable)
      .values({
        title: testTaskWithVendorInput.title,
        description: testTaskWithVendorInput.description,
        due_date: testTaskWithVendorInput.due_date,
        priority: testTaskWithVendorInput.priority,
        status: testTaskWithVendorInput.status,
        assigned_to: testTaskWithVendorInput.assigned_to,
        vendor_id: vendorId
      })
      .returning()
      .execute();

    const taskId = taskResult[0].id;

    // Delete the task
    const deleteInput: DeleteInput = { id: taskId };
    const result = await deleteTask(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify task is deleted from database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(tasks).toHaveLength(0);

    // Verify vendor still exists (should not be affected)
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(1);
    expect(vendors[0].name).toBe('Test Vendor');
  });

  it('should handle multiple task deletions correctly', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First test task',
        due_date: new Date('2024-12-31'),
        priority: 'low',
        status: 'pending',
        assigned_to: 'Person 1',
        vendor_id: null
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second test task',
        due_date: new Date('2025-01-15'),
        priority: 'high',
        status: 'completed',
        assigned_to: 'Person 2',
        vendor_id: null
      })
      .returning()
      .execute();

    // Delete first task
    const deleteResult1 = await deleteTask({ id: task1[0].id });
    expect(deleteResult1.success).toBe(true);

    // Delete second task
    const deleteResult2 = await deleteTask({ id: task2[0].id });
    expect(deleteResult2.success).toBe(true);

    // Verify both tasks are deleted
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(0);
  });

  it('should validate task exists before deletion attempt', async () => {
    // Create and then delete a task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Temporary Task',
        description: 'Will be deleted',
        due_date: new Date('2024-12-31'),
        priority: 'medium',
        status: 'pending',
        assigned_to: 'Test User',
        vendor_id: null
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // First deletion should succeed
    const firstDelete = await deleteTask({ id: taskId });
    expect(firstDelete.success).toBe(true);

    // Second deletion attempt should return false
    const secondDelete = await deleteTask({ id: taskId });
    expect(secondDelete.success).toBe(false);
  });
});