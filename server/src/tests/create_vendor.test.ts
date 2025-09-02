import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { type CreateVendorInput } from '../schema';
import { createVendor } from '../handlers/create_vendor';
import { eq } from 'drizzle-orm';

// Test input with all fields
const fullTestInput: CreateVendorInput = {
  name: 'Beautiful Blooms Photography',
  category: 'Photography',
  contact_person: 'John Smith',
  email: 'john@beautifulblooms.com',
  phone: '555-123-4567',
  website: 'https://beautifulblooms.com',
  address: '123 Main St, City, State 12345',
  service_description: 'Professional wedding photography and videography services',
  contract_amount: 2500.00,
  deposit_paid: 750.50,
  notes: 'Specializes in outdoor weddings, includes engagement session'
};

// Minimal test input with only required fields
const minimalTestInput: CreateVendorInput = {
  name: 'Simple Catering',
  category: 'Catering',
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

describe('createVendor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a vendor with all fields', async () => {
    const result = await createVendor(fullTestInput);

    // Basic field validation
    expect(result.name).toEqual('Beautiful Blooms Photography');
    expect(result.category).toEqual('Photography');
    expect(result.contact_person).toEqual('John Smith');
    expect(result.email).toEqual('john@beautifulblooms.com');
    expect(result.phone).toEqual('555-123-4567');
    expect(result.website).toEqual('https://beautifulblooms.com');
    expect(result.address).toEqual('123 Main St, City, State 12345');
    expect(result.service_description).toEqual('Professional wedding photography and videography services');
    expect(result.contract_amount).toEqual(2500.00);
    expect(result.deposit_paid).toEqual(750.50);
    expect(result.notes).toEqual('Specializes in outdoor weddings, includes engagement session');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify numeric fields are returned as numbers
    expect(typeof result.contract_amount).toEqual('number');
    expect(typeof result.deposit_paid).toEqual('number');
  });

  it('should create a vendor with only required fields', async () => {
    const result = await createVendor(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Simple Catering');
    expect(result.category).toEqual('Catering');
    expect(result.contact_person).toBeNull();
    expect(result.email).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.website).toBeNull();
    expect(result.address).toBeNull();
    expect(result.service_description).toBeNull();
    expect(result.contract_amount).toBeNull();
    expect(result.deposit_paid).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save vendor to database', async () => {
    const result = await createVendor(fullTestInput);

    // Query using proper drizzle syntax
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, result.id))
      .execute();

    expect(vendors).toHaveLength(1);
    const vendor = vendors[0];
    expect(vendor.name).toEqual('Beautiful Blooms Photography');
    expect(vendor.category).toEqual('Photography');
    expect(vendor.contact_person).toEqual('John Smith');
    expect(vendor.email).toEqual('john@beautifulblooms.com');
    expect(vendor.phone).toEqual('555-123-4567');
    expect(vendor.website).toEqual('https://beautifulblooms.com');
    expect(vendor.address).toEqual('123 Main St, City, State 12345');
    expect(vendor.service_description).toEqual('Professional wedding photography and videography services');
    expect(parseFloat(vendor.contract_amount!)).toEqual(2500.00);
    expect(parseFloat(vendor.deposit_paid!)).toEqual(750.50);
    expect(vendor.notes).toEqual('Specializes in outdoor weddings, includes engagement session');
    expect(vendor.created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal precision correctly', async () => {
    const precisionTestInput: CreateVendorInput = {
      name: 'Precision Vendor',
      category: 'Testing',
      contact_person: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      service_description: null,
      contract_amount: 1234.56,
      deposit_paid: 99.99,
      notes: null
    };

    const result = await createVendor(precisionTestInput);

    expect(result.contract_amount).toEqual(1234.56);
    expect(result.deposit_paid).toEqual(99.99);

    // Verify in database
    const vendors = await db.select()
      .from(vendorsTable)
      .where(eq(vendorsTable.id, result.id))
      .execute();

    expect(parseFloat(vendors[0].contract_amount!)).toEqual(1234.56);
    expect(parseFloat(vendors[0].deposit_paid!)).toEqual(99.99);
  });

  it('should handle multiple vendors with different categories', async () => {
    const photographerInput: CreateVendorInput = {
      name: 'Amazing Photos',
      category: 'Photography',
      contact_person: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      service_description: null,
      contract_amount: 1800.00,
      deposit_paid: null,
      notes: null
    };

    const catererInput: CreateVendorInput = {
      name: 'Delicious Catering',
      category: 'Catering',
      contact_person: null,
      email: null,
      phone: null,
      website: null,
      address: null,
      service_description: null,
      contract_amount: 3000.00,
      deposit_paid: 500.00,
      notes: null
    };

    // Create both vendors
    const photographer = await createVendor(photographerInput);
    const caterer = await createVendor(catererInput);

    // Verify both were created successfully
    expect(photographer.name).toEqual('Amazing Photos');
    expect(photographer.category).toEqual('Photography');
    expect(photographer.contract_amount).toEqual(1800.00);
    expect(photographer.deposit_paid).toBeNull();

    expect(caterer.name).toEqual('Delicious Catering');
    expect(caterer.category).toEqual('Catering');
    expect(caterer.contract_amount).toEqual(3000.00);
    expect(caterer.deposit_paid).toEqual(500.00);

    // Verify both exist in database
    const allVendors = await db.select().from(vendorsTable).execute();
    expect(allVendors).toHaveLength(2);
  });
});