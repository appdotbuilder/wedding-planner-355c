import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { type UpdateVendorInput, type Vendor } from '../schema';
import { eq } from 'drizzle-orm';

export const updateVendor = async (input: UpdateVendorInput): Promise<Vendor> => {
  try {
    // Extract the id and prepare update data
    const { id, ...updateData } = input;

    // Convert numeric fields to strings for database storage
    const dbUpdateData: any = { ...updateData };
    if ('contract_amount' in updateData) {
      dbUpdateData.contract_amount = updateData.contract_amount !== null 
        ? updateData.contract_amount?.toString() 
        : null;
    }
    if ('deposit_paid' in updateData) {
      dbUpdateData.deposit_paid = updateData.deposit_paid !== null 
        ? updateData.deposit_paid?.toString() 
        : null;
    }

    // Update vendor record
    const result = await db.update(vendorsTable)
      .set(dbUpdateData)
      .where(eq(vendorsTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Vendor with id ${id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const vendor = result[0];
    return {
      ...vendor,
      contract_amount: vendor.contract_amount ? parseFloat(vendor.contract_amount) : null,
      deposit_paid: vendor.deposit_paid ? parseFloat(vendor.deposit_paid) : null
    };
  } catch (error) {
    console.error('Vendor update failed:', error);
    throw error;
  }
};