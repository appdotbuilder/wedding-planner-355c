import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { type CreateVendorInput, type Vendor } from '../schema';

export const createVendor = async (input: CreateVendorInput): Promise<Vendor> => {
  try {
    // Insert vendor record
    const result = await db.insert(vendorsTable)
      .values({
        name: input.name,
        category: input.category,
        contact_person: input.contact_person,
        email: input.email,
        phone: input.phone,
        website: input.website,
        address: input.address,
        service_description: input.service_description,
        contract_amount: input.contract_amount?.toString(), // Convert number to string for numeric column
        deposit_paid: input.deposit_paid?.toString(), // Convert number to string for numeric column
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const vendor = result[0];
    return {
      ...vendor,
      contract_amount: vendor.contract_amount ? parseFloat(vendor.contract_amount) : null, // Convert string back to number
      deposit_paid: vendor.deposit_paid ? parseFloat(vendor.deposit_paid) : null // Convert string back to number
    };
  } catch (error) {
    console.error('Vendor creation failed:', error);
    throw error;
  }
};