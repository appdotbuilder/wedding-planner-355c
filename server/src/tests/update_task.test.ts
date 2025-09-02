import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, vendorsTable } from '../db/schema';
import { type UpdateTaskInput, type CreateVendorInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test vendor data for foreign key testing
const testVendorInput: CreateVendorInput = {
  name: 'Test Vendor',
  category: 'Photography',
  contact_person: 'John Doe',
  email: 'vendor@test.com',
  phone: '123-456-7890',
  website: null,
  address: null,
  service_description: null,
  contract_amount: null,
  deposit_paid: null,
  notes: null
};

// Helper function to create a test task
const createTestTask = async () => {
  const result = await db.insert(tasksTable)
    .values({
      title: 'Original Task',
      description: 'Original description',
      due_date: new Date('2024-01-15'),
      priority: 'low',
      status: 'pending',
      assigned_to: 'Original Person',
      vendor_id: null
    })
    .returning()
    .execute();
  
  return result[0];
};

// Helper function to create a test vendor
const createTestVendor = async () => {
  const result = await db.insert(vendorsTable)
    .values({
      name: testVendorInput.name,
      category: testVendorInput.category,
      contact_person: testVendorInput.contact_person,
      email: testVendorInput.email,
      phone: testVendorInput.phone,
      website: testVendorInput.website,
      address: testVendorInput.address,
      service_description: testVendorInput.service_description,
      contract_amount: testVendorInput.contract_amount?.toString() || null,
      deposit_paid: testVendorInput.deposit_paid?.toString() || null,
      notes: testVendorInput.notes
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.priority).toEqual('low'); // Should remain unchanged
  });

  it('should update task status and priority', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      status: 'completed',
      priority: 'high'
    };

    const result = await updateTask(updateInput);

    expect(result.status).toEqual('completed');
    expect(result.priority).toEqual('high');
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
  });

  it('should update due date', async () => {
    const task = await createTestTask();
    const newDueDate = new Date('2024-02-20');
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      due_date: newDueDate
    };

    const result = await updateTask(updateInput);

    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.due_date?.getTime()).toEqual(newDueDate.getTime());
  });

  it('should update assigned person', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      assigned_to: 'New Assignee'
    };

    const result = await updateTask(updateInput);

    expect(result.assigned_to).toEqual('New Assignee');
  });

  it('should update vendor assignment', async () => {
    const task = await createTestTask();
    const vendor = await createTestVendor();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      vendor_id: vendor.id
    };

    const result = await updateTask(updateInput);

    expect(result.vendor_id).toEqual(vendor.id);
  });

  it('should update multiple fields at once', async () => {
    const task = await createTestTask();
    const vendor = await createTestVendor();
    const newDueDate = new Date('2024-03-10');
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Multi-field Update',
      description: 'Updated description',
      due_date: newDueDate,
      priority: 'high',
      status: 'in_progress',
      assigned_to: 'Multi Assignee',
      vendor_id: vendor.id
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Multi-field Update');
    expect(result.description).toEqual('Updated description');
    expect(result.due_date?.getTime()).toEqual(newDueDate.getTime());
    expect(result.priority).toEqual('high');
    expect(result.status).toEqual('in_progress');
    expect(result.assigned_to).toEqual('Multi Assignee');
    expect(result.vendor_id).toEqual(vendor.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable fields', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      description: null,
      due_date: null,
      assigned_to: null,
      vendor_id: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
    expect(result.due_date).toBeNull();
    expect(result.assigned_to).toBeNull();
    expect(result.vendor_id).toBeNull();
  });

  it('should save changes to database', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Database Check Title',
      status: 'completed'
    };

    await updateTask(updateInput);

    // Verify changes were persisted
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(savedTasks).toHaveLength(1);
    expect(savedTasks[0].title).toEqual('Database Check Title');
    expect(savedTasks[0].status).toEqual('completed');
  });

  it('should throw error when task not found', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999,
      title: 'Non-existent Task'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/Task with ID 999 not found/i);
  });

  it('should only update provided fields', async () => {
    const task = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Only Title Updated'
    };

    const result = await updateTask(updateInput);

    // Only title should be updated
    expect(result.title).toEqual('Only Title Updated');
    
    // All other fields should remain the same
    expect(result.description).toEqual('Original description');
    expect(result.due_date?.getTime()).toEqual(new Date('2024-01-15').getTime());
    expect(result.priority).toEqual('low');
    expect(result.status).toEqual('pending');
    expect(result.assigned_to).toEqual('Original Person');
    expect(result.vendor_id).toBeNull();
  });

  it('should work with valid vendor foreign key', async () => {
    const task = await createTestTask();
    const vendor = await createTestVendor();
    
    const updateInput: UpdateTaskInput = {
      id: task.id,
      vendor_id: vendor.id
    };

    const result = await updateTask(updateInput);

    expect(result.vendor_id).toEqual(vendor.id);

    // Verify in database
    const savedTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute();

    expect(savedTask[0].vendor_id).toEqual(vendor.id);
  });
});