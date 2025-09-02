import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { type Vendor } from '../schema';

export const getVendors = async (): Promise<Vendor[]> => {
  try {
    // Fetch all vendors from the database
    const results = await db.select()
      .from(vendorsTable)
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(vendor => ({
      ...vendor,
      contract_amount: vendor.contract_amount ? parseFloat(vendor.contract_amount) : null,
      deposit_paid: vendor.deposit_paid ? parseFloat(vendor.deposit_paid) : null
    }));
  } catch (error) {
    console.error('Failed to fetch vendors:', error);
    throw error;
  }
};