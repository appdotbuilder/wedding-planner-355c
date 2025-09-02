import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, vendorsTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Test input for basic task creation
const testTaskInput: CreateTaskInput = {
  title: 'Book wedding venue',
  description: 'Research and book the perfect venue for the ceremony',
  due_date: new Date('2024-06-15'),
  priority: 'high',
  status: 'pending',
  assigned_to: 'John Doe',
  vendor_id: null
};

// Test input with minimal required fields
const minimalTaskInput: CreateTaskInput = {
  title: 'Send invitations',
  description: null,
  due_date: null,
  priority: 'medium',
  status: 'pending',
  assigned_to: null,
  vendor_id: null
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task with all fields', async () => {
    const result = await createTask(testTaskInput);

    // Verify all fields are properly set
    expect(result.title).toEqual('Book wedding venue');
    expect(result.description).toEqual('Research and book the perfect venue for the ceremony');
    expect(result.due_date).toEqual(new Date('2024-06-15'));
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('pending');
    expect(result.assigned_to).toEqual('John Doe');
    expect(result.vendor_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a task with minimal required fields', async () => {
    const result = await createTask(minimalTaskInput);

    // Verify required fields
    expect(result.title).toEqual('Send invitations');
    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.priority).toEqual('medium');
    expect(result.status).toEqual('pending');
    expect(result.assigned_to).toBeNull();
    expect(result.vendor_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testTaskInput);

    // Query database to verify task was saved
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Book wedding venue');
    expect(tasks[0].description).toEqual('Research and book the perfect venue for the ceremony');
    expect(tasks[0].due_date).toEqual(new Date('2024-06-15'));
    expect(tasks[0].priority).toEqual('high');
    expect(tasks[0].status).toEqual('pending');
    expect(tasks[0].assigned_to).toEqual('John Doe');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
  });

  it('should create task with valid vendor association', async () => {
    // First create a vendor
    const vendorResult = await db.insert(vendorsTable)
      .values({
        name: 'Perfect Venues Inc.',
        category: 'venue',
        contact_person: 'Jane Smith',
        email: 'jane@perfectvenues.com',
        phone: '555-0123'
      })
      .returning()
      .execute();

    const vendor = vendorResult[0];

    // Create task with vendor association
    const taskWithVendor: CreateTaskInput = {
      ...testTaskInput,
      vendor_id: vendor.id
    };

    const result = await createTask(taskWithVendor);

    expect(result.vendor_id).toEqual(vendor.id);
    expect(result.title).toEqual('Book wedding venue');

    // Verify in database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks[0].vendor_id).toEqual(vendor.id);
  });

  it('should create tasks with different priority levels', async () => {
    const lowPriorityTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'Low priority task',
      priority: 'low'
    };

    const mediumPriorityTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'Medium priority task',
      priority: 'medium'
    };

    const highPriorityTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'High priority task',
      priority: 'high'
    };

    const lowResult = await createTask(lowPriorityTask);
    const mediumResult = await createTask(mediumPriorityTask);
    const highResult = await createTask(highPriorityTask);

    expect(lowResult.priority).toEqual('low');
    expect(mediumResult.priority).toEqual('medium');
    expect(highResult.priority).toEqual('high');
  });

  it('should create tasks with different status values', async () => {
    const pendingTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'Pending task',
      status: 'pending'
    };

    const inProgressTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'In progress task',
      status: 'in_progress'
    };

    const completedTask: CreateTaskInput = {
      ...minimalTaskInput,
      title: 'Completed task',
      status: 'completed'
    };

    const pendingResult = await createTask(pendingTask);
    const inProgressResult = await createTask(inProgressTask);
    const completedResult = await createTask(completedTask);

    expect(pendingResult.status).toEqual('pending');
    expect(inProgressResult.status).toEqual('in_progress');
    expect(completedResult.status).toEqual('completed');
  });

  it('should throw error when vendor_id references non-existent vendor', async () => {
    const taskWithInvalidVendor: CreateTaskInput = {
      ...testTaskInput,
      vendor_id: 999 // Non-existent vendor ID
    };

    await expect(createTask(taskWithInvalidVendor)).rejects.toThrow(/vendor with id 999 does not exist/i);
  });

  it('should handle tasks with future due dates', async () => {
    const futureDate = new Date('2025-12-31');
    const futureTask: CreateTaskInput = {
      ...testTaskInput,
      title: 'Future task',
      due_date: futureDate
    };

    const result = await createTask(futureTask);

    expect(result.due_date).toEqual(futureDate);
    expect(result.title).toEqual('Future task');
  });

  it('should handle tasks with past due dates', async () => {
    const pastDate = new Date('2023-01-01');
    const pastTask: CreateTaskInput = {
      ...testTaskInput,
      title: 'Past due task',
      due_date: pastDate
    };

    const result = await createTask(pastTask);

    expect(result.due_date).toEqual(pastDate);
    expect(result.title).toEqual('Past due task');
  });
});