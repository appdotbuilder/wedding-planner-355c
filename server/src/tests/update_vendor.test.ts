import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { type CreateVendorInput, type UpdateVendorInput } from '../schema';
import { updateVendor } from '../handlers/update_vendor';
import { eq } from 'drizzle-orm';

// Helper function to create a vendor for testing
const createTestVendor = async (): Promise<number> => {
  const testVendor: CreateVendorInput = {
    name: 'Test Vendor',
    category: 'Photography',
    contact_person: 'John Doe',
    email: 'john@vendor.com',
    phone: '123-456-7890',
    website: 'https://vendor.com',
    address: '123 Test St',
    service_description: 'Wedding photography services',
    contract_amount: 2500.00,
    deposit_paid: 500.00,
    notes: 'Initial notes'
  };

  const result = await db.insert(vendorsTable)
    .values({
      ...testVendor,
      contract_amount: testVendor.contract_amount?.toString(),
      deposit_paid: testVendor.deposit_paid?.toString()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateVendor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update vendor basic information', async () => {
    const vendorId = await createTestVendor();

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      name: 'Updated Vendor Name',
      category: 'Updated Category',
      contact_person: 'Jane Smith'
    };

    const result = await updateVendor(updateInput);

    // Verify returned data
    expect(result.id).toEqual(vendorId);
    expect(result.name).toEqual('Updated Vendor Name');
    expect(result.category).toEqual('Updated Category');
    expect(result.contact_person).toEqual('Jane Smith');
    expect(result.email).toEqual('john@vendor.com'); // Unchanged
    expect(result.phone).toEqual('123-456-7890'); // Unchanged
  });

  it('should update vendor contact information', async () => {
    const vendorId = await createTestVendor();

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      email: 'updated@vendor.com',
      phone: '987-654-3210',
      website: 'https://updated-vendor.com',
      address: '456 Updated Ave'
    };

    const result = await updateVendor(updateInput);

    expect(result.id).toEqual(vendorId);
    expect(result.email).toEqual('updated@vendor.com');
    expect(result.phone).toEqual('987-654-3210');
    expect(result.website).toEqual('https://updated-vendor.com');
    expect(result.address).toEqual('456 Updated Ave');
    expect(result.name).toEqual('Test Vendor'); // Unchanged
  });

  it('should update vendor contract amounts with proper numeric conversion', async () => {
    const vendorId = await createTestVendor();

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      contract_amount: 3500.50,
      deposit_paid: 750.25
    };

    const result = await updateVendor(updateInput);

    expect(result.id).toEqual(vendorId);
    expect(result.contract_amount).toEqual(3500.50);
    expect(result.deposit_paid).toEqual(750.25);
    expect(typeof result.contract_amount).toBe('number');
    expect(typeof result.deposit_paid).toBe('number');
  });

  it('should handle null values for optional fields', async () => {
    const vendorId = await createTestVendor();

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      contact_person: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      service_description: null,
      contract_amount: null,
      deposit_paid: null,
      notes: null
    };

    const result = await updateVendor(updateInput);

    expect(result.id).toEqual(vendorId);
    expect(result.contact_person).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
    expect(result.address).toBeNull();
    expect(result.service_description).toBeNull();
    expect(result.contract_amount).toBeNull();
    expect(result.deposit_paid).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.name).toEqual('Test Vendor'); // Unchanged
    expect(result.category).toEqual('Photography'); // Unchanged
  });

  it('should update vendor in database', async () => {
    const vendorId = await createTestVendor();

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      name: 'Database Updated Vendor',
      service_description: 'Updated service description',
      notes: 'Updated notes'
    };

    await updateVendor(updateInput);

    // Verify database was actually updated
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();

    expect(vendors).toHaveLength(1);
    expect(vendors[0].name).toEqual('Database Updated Vendor');
    expect(vendors[0].service_description).toEqual('Updated service description');
    expect(vendors[0].notes).toEqual('Updated notes');
    expect(vendors[0].category).toEqual('Photography'); // Unchanged
  });

  it('should throw error when vendor not found', async () => {
    const nonExistentId = 99999;

    const updateInput: UpdateVendorInput = {
      id: nonExistentId,
      name: 'Non-existent Vendor'
    };

    await expect(updateVendor(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    const vendorId = await createTestVendor();

    // Only update one field
    const updateInput: UpdateVendorInput = {
      id: vendorId,
      notes: 'Only notes updated'
    };

    const result = await updateVendor(updateInput);

    expect(result.id).toEqual(vendorId);
    expect(result.notes).toEqual('Only notes updated');
    // All other fields should remain unchanged
    expect(result.name).toEqual('Test Vendor');
    expect(result.category).toEqual('Photography');
    expect(result.contact_person).toEqual('John Doe');
    expect(result.email).toEqual('john@vendor.com');
    expect(result.contract_amount).toEqual(2500.00);
    expect(result.deposit_paid).toEqual(500.00);
  });

  it('should preserve created_at timestamp', async () => {
    const vendorId = await createTestVendor();

    // Get original created_at
    const originalVendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, vendorId))
      .execute();
    const originalCreatedAt = originalVendors[0].created_at;

    const updateInput: UpdateVendorInput = {
      id: vendorId,
      name: 'Updated Name'
    };

    const result = await updateVendor(updateInput);

    expect(result.created_at).toEqual(originalCreatedAt);
    expect(result.created_at).toBeInstanceOf(Date);
  });
});