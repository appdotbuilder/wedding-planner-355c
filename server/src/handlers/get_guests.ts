import { db } from '../db';
import { guestsTable } from '../db/schema';
import { type Guest } from '../schema';

export const getGuests = async (): Promise<Guest[]> => {
  try {
    // Fetch all guests from the database
    const results = await db.select()
      .from(guestsTable)
      .execute();

    // Return the results directly since no numeric conversions are needed
    // All fields are already in the correct format
    return results;
  } catch (error) {
    console.error('Failed to fetch guests:', error);
    throw error;
  }
};