import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, vendorsTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks with correct properties', async () => {
    // Insert test task
    await db.insert(tasksTable).values({
      title: 'Book venue',
      description: 'Find and book the wedding venue',
      priority: 'high',
      status: 'pending',
      assigned_to: 'Jane',
      due_date: new Date('2024-06-01')
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(task.id).toBeDefined();
    expect(task.title).toEqual('Book venue');
    expect(task.description).toEqual('Find and book the wedding venue');
    expect(task.priority).toEqual('high');
    expect(task.status).toEqual('pending');
    expect(task.assigned_to).toEqual('Jane');
    expect(task.due_date).toBeInstanceOf(Date);
    expect(task.due_date?.toISOString()).toEqual('2024-06-01T00:00:00.000Z');
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.vendor_id).toBeNull();
  });

  it('should return multiple tasks ordered by creation date (newest first)', async () => {
    // Insert multiple tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable).values({
      title: 'First task',
      description: 'This was created first',
      priority: 'low',
      status: 'completed'
    }).execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Second task',
      description: 'This was created second',
      priority: 'medium',
      status: 'in_progress'
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable).values({
      title: 'Third task',
      description: 'This was created third',
      priority: 'high',
      status: 'pending'
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Should be ordered by created_at desc (newest first)
    expect(result[0].title).toEqual('Third task');
    expect(result[1].title).toEqual('Second task');
    expect(result[2].title).toEqual('First task');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle tasks with vendor_id reference', async () => {
    // Create a vendor first
    const vendor = await db.insert(vendorsTable).values({
      name: 'Perfect Venues',
      category: 'Venue',
      contact_person: 'John Smith',
      email: 'john@perfectvenues.com'
    }).returning().execute();

    // Create task with vendor reference
    await db.insert(tasksTable).values({
      title: 'Confirm venue details',
      description: 'Review contract and confirm booking details',
      priority: 'high',
      status: 'pending',
      vendor_id: vendor[0].id,
      due_date: new Date('2024-05-15')
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    expect(result[0].vendor_id).toEqual(vendor[0].id);
    expect(result[0].title).toEqual('Confirm venue details');
  });

  it('should handle tasks with all priority levels', async () => {
    await db.insert(tasksTable).values([
      {
        title: 'Low priority task',
        priority: 'low',
        status: 'pending'
      },
      {
        title: 'Medium priority task',
        priority: 'medium',
        status: 'in_progress'
      },
      {
        title: 'High priority task',
        priority: 'high',
        status: 'completed'
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    const priorities = result.map(task => task.priority);
    expect(priorities).toContain('low');
    expect(priorities).toContain('medium');
    expect(priorities).toContain('high');
  });

  it('should handle tasks with all status levels', async () => {
    await db.insert(tasksTable).values([
      {
        title: 'Pending task',
        priority: 'medium',
        status: 'pending'
      },
      {
        title: 'In progress task',
        priority: 'medium',
        status: 'in_progress'
      },
      {
        title: 'Completed task',
        priority: 'medium',
        status: 'completed'
      }
    ]).execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    const statuses = result.map(task => task.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('in_progress');
    expect(statuses).toContain('completed');
  });

  it('should handle tasks with nullable fields', async () => {
    await db.insert(tasksTable).values({
      title: 'Minimal task',
      // All other fields are nullable and should default appropriately
      description: null,
      due_date: null,
      assigned_to: null,
      vendor_id: null
      // priority and status have defaults from Zod schema
    }).execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    
    const task = result[0];
    expect(task.title).toEqual('Minimal task');
    expect(task.description).toBeNull();
    expect(task.due_date).toBeNull();
    expect(task.assigned_to).toBeNull();
    expect(task.vendor_id).toBeNull();
    expect(task.priority).toEqual('medium'); // Default from DB schema
    expect(task.status).toEqual('pending'); // Default from DB schema
    expect(task.created_at).toBeInstanceOf(Date);
  });
});