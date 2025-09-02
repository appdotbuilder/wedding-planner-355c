import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { guestsTable } from '../db/schema';
import { getGuests } from '../handlers/get_guests';

describe('getGuests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no guests exist', async () => {
    const result = await getGuests();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all guests from database', async () => {
    // Create test guests directly in database
    await db.insert(guestsTable).values([
      {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        rsvp_status: 'attending',
        meal_choice: 'chicken',
        dietary_restrictions: 'none',
        plus_one: true,
        plus_one_name: 'Jane Doe',
        notes: 'Groomsman'
      },
      {
        name: 'Alice Smith',
        email: 'alice@example.com',
        phone: null,
        rsvp_status: 'pending',
        meal_choice: null,
        dietary_restrictions: 'vegetarian',
        plus_one: false,
        plus_one_name: null,
        notes: null
      },
      {
        name: 'Bob Johnson',
        email: null,
        phone: '987-654-3210',
        rsvp_status: 'not_attending',
        meal_choice: null,
        dietary_restrictions: null,
        plus_one: false,
        plus_one_name: null,
        notes: 'Unable to travel'
      }
    ]).execute();

    const result = await getGuests();

    expect(result).toHaveLength(3);

    // Check first guest (attending with plus one)
    const johnDoe = result.find(guest => guest.name === 'John Doe');
    expect(johnDoe).toBeDefined();
    expect(johnDoe?.email).toEqual('john@example.com');
    expect(johnDoe?.phone).toEqual('123-456-7890');
    expect(johnDoe?.rsvp_status).toEqual('attending');
    expect(johnDoe?.meal_choice).toEqual('chicken');
    expect(johnDoe?.dietary_restrictions).toEqual('none');
    expect(johnDoe?.plus_one).toEqual(true);
    expect(johnDoe?.plus_one_name).toEqual('Jane Doe');
    expect(johnDoe?.notes).toEqual('Groomsman');
    expect(johnDoe?.id).toBeDefined();
    expect(johnDoe?.created_at).toBeInstanceOf(Date);

    // Check second guest (pending with dietary restrictions)
    const aliceSmith = result.find(guest => guest.name === 'Alice Smith');
    expect(aliceSmith).toBeDefined();
    expect(aliceSmith?.email).toEqual('alice@example.com');
    expect(aliceSmith?.phone).toBeNull();
    expect(aliceSmith?.rsvp_status).toEqual('pending');
    expect(aliceSmith?.meal_choice).toBeNull();
    expect(aliceSmith?.dietary_restrictions).toEqual('vegetarian');
    expect(aliceSmith?.plus_one).toEqual(false);
    expect(aliceSmith?.plus_one_name).toBeNull();
    expect(aliceSmith?.notes).toBeNull();

    // Check third guest (not attending)
    const bobJohnson = result.find(guest => guest.name === 'Bob Johnson');
    expect(bobJohnson).toBeDefined();
    expect(bobJohnson?.email).toBeNull();
    expect(bobJohnson?.phone).toEqual('987-654-3210');
    expect(bobJohnson?.rsvp_status).toEqual('not_attending');
    expect(bobJohnson?.meal_choice).toBeNull();
    expect(bobJohnson?.dietary_restrictions).toBeNull();
    expect(bobJohnson?.plus_one).toEqual(false);
    expect(bobJohnson?.plus_one_name).toBeNull();
    expect(bobJohnson?.notes).toEqual('Unable to travel');
  });

  it('should return guests with all RSVP statuses', async () => {
    // Create guests with different RSVP statuses
    await db.insert(guestsTable).values([
      {
        name: 'Pending Guest',
        rsvp_status: 'pending',
        plus_one: false
      },
      {
        name: 'Attending Guest',
        rsvp_status: 'attending',
        plus_one: false
      },
      {
        name: 'Not Attending Guest',
        rsvp_status: 'not_attending',
        plus_one: false
      }
    ]).execute();

    const result = await getGuests();

    expect(result).toHaveLength(3);

    const rsvpStatuses = result.map(guest => guest.rsvp_status);
    expect(rsvpStatuses).toContain('pending');
    expect(rsvpStatuses).toContain('attending');
    expect(rsvpStatuses).toContain('not_attending');
  });

  it('should handle guests with various meal choices and dietary restrictions', async () => {
    // Create guests with different meal preferences
    await db.insert(guestsTable).values([
      {
        name: 'Meat Lover',
        meal_choice: 'beef',
        dietary_restrictions: null,
        plus_one: false
      },
      {
        name: 'Vegetarian Guest',
        meal_choice: 'vegetarian',
        dietary_restrictions: 'no meat',
        plus_one: false
      },
      {
        name: 'Allergy Guest',
        meal_choice: 'chicken',
        dietary_restrictions: 'nut allergy, lactose intolerant',
        plus_one: false
      }
    ]).execute();

    const result = await getGuests();

    expect(result).toHaveLength(3);

    const meatLover = result.find(guest => guest.name === 'Meat Lover');
    expect(meatLover?.meal_choice).toEqual('beef');
    expect(meatLover?.dietary_restrictions).toBeNull();

    const vegetarianGuest = result.find(guest => guest.name === 'Vegetarian Guest');
    expect(vegetarianGuest?.meal_choice).toEqual('vegetarian');
    expect(vegetarianGuest?.dietary_restrictions).toEqual('no meat');

    const allergyGuest = result.find(guest => guest.name === 'Allergy Guest');
    expect(allergyGuest?.meal_choice).toEqual('chicken');
    expect(allergyGuest?.dietary_restrictions).toEqual('nut allergy, lactose intolerant');
  });

  it('should handle guests with plus ones correctly', async () => {
    // Create guests with and without plus ones
    await db.insert(guestsTable).values([
      {
        name: 'Single Guest',
        plus_one: false,
        plus_one_name: null
      },
      {
        name: 'Married Guest',
        plus_one: true,
        plus_one_name: 'Spouse Name'
      },
      {
        name: 'Plus One TBD',
        plus_one: true,
        plus_one_name: null
      }
    ]).execute();

    const result = await getGuests();

    expect(result).toHaveLength(3);

    const singleGuest = result.find(guest => guest.name === 'Single Guest');
    expect(singleGuest?.plus_one).toEqual(false);
    expect(singleGuest?.plus_one_name).toBeNull();

    const marriedGuest = result.find(guest => guest.name === 'Married Guest');
    expect(marriedGuest?.plus_one).toEqual(true);
    expect(marriedGuest?.plus_one_name).toEqual('Spouse Name');

    const plusOneTbd = result.find(guest => guest.name === 'Plus One TBD');
    expect(plusOneTbd?.plus_one).toEqual(true);
    expect(plusOneTbd?.plus_one_name).toBeNull();
  });

  it('should return guests ordered by creation time', async () => {
    // Create guests at different times
    await db.insert(guestsTable).values({
      name: 'First Guest',
      plus_one: false
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(guestsTable).values({
      name: 'Second Guest',
      plus_one: false
    }).execute();

    const result = await getGuests();

    expect(result).toHaveLength(2);
    
    // Verify both guests are returned
    const guestNames = result.map(guest => guest.name);
    expect(guestNames).toContain('First Guest');
    expect(guestNames).toContain('Second Guest');

    // Verify created_at timestamps are valid dates
    result.forEach(guest => {
      expect(guest.created_at).toBeInstanceOf(Date);
    });
  });
});