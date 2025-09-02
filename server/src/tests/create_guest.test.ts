import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type CreateGuestInput } from '../schema';
import { createGuest } from '../handlers/create_guest';
import { eq } from 'drizzle-orm';

// Complete test input with all fields
const testInput: CreateGuestInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0123',
  rsvp_status: 'attending',
  meal_choice: 'Vegetarian',
  dietary_restrictions: 'No nuts',
  plus_one: true,
  plus_one_name: 'Jane Doe',
  notes: 'Needs wheelchair accessibility'
};

// Minimal test input with only required fields and defaults
const minimalInput: CreateGuestInput = {
  name: 'Jane Smith',
  email: null,
  phone: null,
  rsvp_status: 'pending',
  meal_choice: null,
  dietary_restrictions: null,
  plus_one: false,
  plus_one_name: null,
  notes: null
};

describe('createGuest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a guest with all fields', async () => {
    const result = await createGuest(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('+1-555-0123');
    expect(result.rsvp_status).toEqual('attending');
    expect(result.meal_choice).toEqual('Vegetarian');
    expect(result.dietary_restrictions).toEqual('No nuts');
    expect(result.plus_one).toEqual(true);
    expect(result.plus_one_name).toEqual('Jane Doe');
    expect(result.notes).toEqual('Needs wheelchair accessibility');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a guest with minimal fields and defaults', async () => {
    const result = await createGuest(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.rsvp_status).toEqual('pending'); // Zod default
    expect(result.meal_choice).toBeNull();
    expect(result.dietary_restrictions).toBeNull();
    expect(result.plus_one).toEqual(false); // Zod default
    expect(result.plus_one_name).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save guest to database', async () => {
    const result = await createGuest(testInput);

    // Query using proper drizzle syntax
    const guests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, result.id))
      .execute();

    expect(guests).toHaveLength(1);
    expect(guests[0].name).toEqual('John Doe');
    expect(guests[0].email).toEqual('john.doe@example.com');
    expect(guests[0].phone).toEqual('+1-555-0123');
    expect(guests[0].rsvp_status).toEqual('attending');
    expect(guests[0].meal_choice).toEqual('Vegetarian');
    expect(guests[0].dietary_restrictions).toEqual('No nuts');
    expect(guests[0].plus_one).toEqual(true);
    expect(guests[0].plus_one_name).toEqual('Jane Doe');
    expect(guests[0].notes).toEqual('Needs wheelchair accessibility');
    expect(guests[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different RSVP statuses correctly', async () => {
    // Test each RSVP status
    const rsvpStatuses: Array<'pending' | 'attending' | 'not_attending'> = ['pending', 'attending', 'not_attending'];
    
    for (const status of rsvpStatuses) {
      const input: CreateGuestInput = {
        ...minimalInput,
        name: `Guest ${status}`,
        rsvp_status: status
      };

      const result = await createGuest(input);
      expect(result.rsvp_status).toEqual(status);

      // Verify in database
      const dbGuests = await db.select()
        .from(guestsTable)
        .where(eq(guestsTable.id, result.id))
        .execute();

      expect(dbGuests[0].rsvp_status).toEqual(status);
    }
  });

  it('should handle plus-one scenarios correctly', async () => {
    // Test plus-one without name
    const plusOneWithoutName: CreateGuestInput = {
      ...minimalInput,
      name: 'Guest With Plus One',
      plus_one: true,
      plus_one_name: null
    };

    const result1 = await createGuest(plusOneWithoutName);
    expect(result1.plus_one).toEqual(true);
    expect(result1.plus_one_name).toBeNull();

    // Test plus-one with name
    const plusOneWithName: CreateGuestInput = {
      ...minimalInput,
      name: 'Guest With Named Plus One',
      plus_one: true,
      plus_one_name: 'Plus One Name'
    };

    const result2 = await createGuest(plusOneWithName);
    expect(result2.plus_one).toEqual(true);
    expect(result2.plus_one_name).toEqual('Plus One Name');

    // Test no plus-one
    const noPlusOne: CreateGuestInput = {
      ...minimalInput,
      name: 'Guest Without Plus One',
      plus_one: false
    };

    const result3 = await createGuest(noPlusOne);
    expect(result3.plus_one).toEqual(false);
    expect(result3.plus_one_name).toBeNull();
  });

  it('should create multiple guests independently', async () => {
    const guest1Input: CreateGuestInput = {
      ...minimalInput,
      name: 'First Guest',
      email: 'first@example.com'
    };

    const guest2Input: CreateGuestInput = {
      ...minimalInput,
      name: 'Second Guest',
      email: 'second@example.com'
    };

    const result1 = await createGuest(guest1Input);
    const result2 = await createGuest(guest2Input);

    // Verify they have different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('First Guest');
    expect(result2.name).toEqual('Second Guest');
    expect(result1.email).toEqual('first@example.com');
    expect(result2.email).toEqual('second@example.com');

    // Verify both exist in database
    const allGuests = await db.select()
      .from(guestsTable)
      .execute();

    expect(allGuests).toHaveLength(2);
    const names = allGuests.map(g => g.name);
    expect(names).toContain('First Guest');
    expect(names).toContain('Second Guest');
  });
});