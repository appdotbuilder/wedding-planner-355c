import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type DeleteInput, type CreateGuestInput } from '../schema';
import { deleteGuest } from '../handlers/delete_guest';
import { eq } from 'drizzle-orm';

// Test input for creating a guest to delete
const testCreateInput: CreateGuestInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  rsvp_status: 'pending',
  meal_choice: 'chicken',
  dietary_restrictions: 'none',
  plus_one: false,
  plus_one_name: null,
  notes: 'Test guest'
};

describe('deleteGuest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing guest', async () => {
    // First create a guest
    const insertResult = await db.insert(guestsTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const createdGuest = insertResult[0];
    
    // Now delete the guest
    const deleteInput: DeleteInput = { id: createdGuest.id };
    const result = await deleteGuest(deleteInput);

    // Verify deletion was successful
    expect(result.success).toBe(true);
  });

  it('should remove guest from database', async () => {
    // First create a guest
    const insertResult = await db.insert(guestsTable)
      .values(testCreateInput)
      .returning()
      .execute();

    const createdGuest = insertResult[0];
    
    // Delete the guest
    const deleteInput: DeleteInput = { id: createdGuest.id };
    await deleteGuest(deleteInput);

    // Verify guest no longer exists in database
    const remainingGuests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, createdGuest.id))
      .execute();

    expect(remainingGuests).toHaveLength(0);
  });

  it('should return false for non-existent guest', async () => {
    // Try to delete a guest that doesn't exist
    const deleteInput: DeleteInput = { id: 99999 };
    const result = await deleteGuest(deleteInput);

    // Should return success: false since no record was deleted
    expect(result.success).toBe(false);
  });

  it('should not affect other guests when deleting one', async () => {
    // Create multiple guests
    const guest1Input = { ...testCreateInput, name: 'Guest 1', email: 'guest1@example.com' };
    const guest2Input = { ...testCreateInput, name: 'Guest 2', email: 'guest2@example.com' };
    const guest3Input = { ...testCreateInput, name: 'Guest 3', email: 'guest3@example.com' };

    const [guest1, guest2, guest3] = await Promise.all([
      db.insert(guestsTable).values(guest1Input).returning().execute(),
      db.insert(guestsTable).values(guest2Input).returning().execute(),
      db.insert(guestsTable).values(guest3Input).returning().execute()
    ]);

    // Delete the middle guest
    const deleteInput: DeleteInput = { id: guest2[0].id };
    const result = await deleteGuest(deleteInput);

    expect(result.success).toBe(true);

    // Verify other guests still exist
    const remainingGuests = await db.select()
      .from(guestsTable)
      .execute();

    expect(remainingGuests).toHaveLength(2);
    
    const remainingIds = remainingGuests.map(g => g.id);
    expect(remainingIds).toContain(guest1[0].id);
    expect(remainingIds).toContain(guest3[0].id);
    expect(remainingIds).not.toContain(guest2[0].id);
  });

  it('should handle guests with all field types', async () => {
    // Create a guest with all possible field values
    const fullGuestInput: CreateGuestInput = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+9876543210',
      rsvp_status: 'attending',
      meal_choice: 'vegetarian',
      dietary_restrictions: 'gluten-free',
      plus_one: true,
      plus_one_name: 'John Smith',
      notes: 'VIP guest with special requirements'
    };

    const insertResult = await db.insert(guestsTable)
      .values(fullGuestInput)
      .returning()
      .execute();

    const createdGuest = insertResult[0];
    
    // Delete the guest
    const deleteInput: DeleteInput = { id: createdGuest.id };
    const result = await deleteGuest(deleteInput);

    expect(result.success).toBe(true);

    // Verify guest is completely removed
    const remainingGuests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, createdGuest.id))
      .execute();

    expect(remainingGuests).toHaveLength(0);
  });
});