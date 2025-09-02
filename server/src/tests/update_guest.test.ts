import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type CreateGuestInput, type UpdateGuestInput } from '../schema';
import { updateGuest } from '../handlers/update_guest';
import { eq } from 'drizzle-orm';

// Helper function to create a test guest
const createTestGuest = async (): Promise<number> => {
  const testGuestData: CreateGuestInput = {
    name: 'Original Guest',
    email: 'original@example.com',
    phone: '123-456-7890',
    rsvp_status: 'pending',
    meal_choice: 'chicken',
    dietary_restrictions: 'none',
    plus_one: false,
    plus_one_name: null,
    notes: 'Original notes'
  };

  const result = await db.insert(guestsTable)
    .values(testGuestData)
    .returning()
    .execute();

  return result[0].id;
};

describe('updateGuest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update guest basic information', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      name: 'Updated Guest Name',
      email: 'updated@example.com',
      phone: '987-654-3210'
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.name).toEqual('Updated Guest Name');
    expect(result.email).toEqual('updated@example.com');
    expect(result.phone).toEqual('987-654-3210');
    // Unchanged fields should remain the same
    expect(result.rsvp_status).toEqual('pending');
    expect(result.meal_choice).toEqual('chicken');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update RSVP status and meal choice', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      rsvp_status: 'attending',
      meal_choice: 'vegetarian',
      dietary_restrictions: 'gluten-free'
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.rsvp_status).toEqual('attending');
    expect(result.meal_choice).toEqual('vegetarian');
    expect(result.dietary_restrictions).toEqual('gluten-free');
    // Unchanged fields should remain the same
    expect(result.name).toEqual('Original Guest');
    expect(result.email).toEqual('original@example.com');
  });

  it('should update plus one information', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      plus_one: true,
      plus_one_name: 'John Doe',
      notes: 'Bringing spouse'
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.plus_one).toEqual(true);
    expect(result.plus_one_name).toEqual('John Doe');
    expect(result.notes).toEqual('Bringing spouse');
    // Unchanged fields should remain the same
    expect(result.name).toEqual('Original Guest');
    expect(result.rsvp_status).toEqual('pending');
  });

  it('should handle partial updates correctly', async () => {
    const guestId = await createTestGuest();

    // Update only one field
    const updateInput: UpdateGuestInput = {
      id: guestId,
      rsvp_status: 'not_attending'
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.rsvp_status).toEqual('not_attending');
    // All other fields should remain unchanged
    expect(result.name).toEqual('Original Guest');
    expect(result.email).toEqual('original@example.com');
    expect(result.phone).toEqual('123-456-7890');
    expect(result.meal_choice).toEqual('chicken');
    expect(result.plus_one).toEqual(false);
  });

  it('should handle null values correctly', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      email: null,
      phone: null,
      meal_choice: null,
      dietary_restrictions: null,
      plus_one_name: null,
      notes: null
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.meal_choice).toBeNull();
    expect(result.dietary_restrictions).toBeNull();
    expect(result.plus_one_name).toBeNull();
    expect(result.notes).toBeNull();
    // Non-null fields should remain unchanged
    expect(result.name).toEqual('Original Guest');
    expect(result.rsvp_status).toEqual('pending');
  });

  it('should persist changes to database', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      name: 'Database Updated Guest',
      rsvp_status: 'attending',
      meal_choice: 'fish'
    };

    await updateGuest(updateInput);

    // Verify changes were saved to database
    const savedGuests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, guestId))
      .execute();

    expect(savedGuests).toHaveLength(1);
    const savedGuest = savedGuests[0];
    expect(savedGuest.name).toEqual('Database Updated Guest');
    expect(savedGuest.rsvp_status).toEqual('attending');
    expect(savedGuest.meal_choice).toEqual('fish');
    expect(savedGuest.created_at).toBeInstanceOf(Date);
  });

  it('should throw error when guest does not exist', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateGuestInput = {
      id: nonExistentId,
      name: 'This Should Fail'
    };

    await expect(updateGuest(updateInput)).rejects.toThrow(/Guest with id 99999 not found/i);
  });

  it('should handle comprehensive guest update', async () => {
    const guestId = await createTestGuest();

    const updateInput: UpdateGuestInput = {
      id: guestId,
      name: 'Comprehensive Update Guest',
      email: 'comprehensive@example.com',
      phone: '555-0123',
      rsvp_status: 'attending',
      meal_choice: 'vegan',
      dietary_restrictions: 'nut allergy',
      plus_one: true,
      plus_one_name: 'Jane Smith',
      notes: 'VIP guest - front table'
    };

    const result = await updateGuest(updateInput);

    expect(result.id).toEqual(guestId);
    expect(result.name).toEqual('Comprehensive Update Guest');
    expect(result.email).toEqual('comprehensive@example.com');
    expect(result.phone).toEqual('555-0123');
    expect(result.rsvp_status).toEqual('attending');
    expect(result.meal_choice).toEqual('vegan');
    expect(result.dietary_restrictions).toEqual('nut allergy');
    expect(result.plus_one).toEqual(true);
    expect(result.plus_one_name).toEqual('Jane Smith');
    expect(result.notes).toEqual('VIP guest - front table');
    expect(result.created_at).toBeInstanceOf(Date);
  });
});