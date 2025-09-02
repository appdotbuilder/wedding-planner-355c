import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type UpdateGuestInput, type Guest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateGuest = async (input: UpdateGuestInput): Promise<Guest> => {
  try {
    // Check if guest exists
    const existingGuests = await db.select()
      .from(guestsTable)
      .where(eq(guestsTable.id, input.id))
      .execute();

    if (existingGuests.length === 0) {
      throw new Error(`Guest with id ${input.id} not found`);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.rsvp_status !== undefined) updateData.rsvp_status = input.rsvp_status;
    if (input.meal_choice !== undefined) updateData.meal_choice = input.meal_choice;
    if (input.dietary_restrictions !== undefined) updateData.dietary_restrictions = input.dietary_restrictions;
    if (input.plus_one !== undefined) updateData.plus_one = input.plus_one;
    if (input.plus_one_name !== undefined) updateData.plus_one_name = input.plus_one_name;
    if (input.notes !== undefined) updateData.notes = input.notes;

    // Update guest record
    const result = await db.update(guestsTable)
      .set(updateData)
      .where(eq(guestsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Guest update failed:', error);
    throw error;
  }
};