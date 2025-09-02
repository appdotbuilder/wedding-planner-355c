import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type CreateGuestInput, type Guest } from '../schema';

export const createGuest = async (input: CreateGuestInput): Promise<Guest> => {
  try {
    // Insert guest record
    const result = await db.insert(guestsTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        rsvp_status: input.rsvp_status,
        meal_choice: input.meal_choice,
        dietary_restrictions: input.dietary_restrictions,
        plus_one: input.plus_one,
        plus_one_name: input.plus_one_name,
        notes: input.notes
      })
      .returning()
      .execute();

    // Return the created guest
    const guest = result[0];
    return {
      ...guest
    };
  } catch (error) {
    console.error('Guest creation failed:', error);
    throw error;
  }
};