import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { vendorsTable } from '../db/schema';
import { getVendors } from '../handlers/get_vendors';

describe('getVendors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no vendors exist', async () => {
    const result = await getVendors();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should fetch single vendor with all fields', async () => {
    // Create test vendor
    await db.insert(vendorsTable)
      .values({
        name: 'Elegant Flowers',
        category: 'Florist',
        contact_person: 'Jane Smith',
        email: 'jane@elegantflowers.com',
        phone: '+1-555-0101',
        website: 'https://elegantflowers.com',
        address: '123 Main St, Springfield, IL',
        service_description: 'Wedding bouquets and centerpieces',
        contract_amount: '2500.50',
        deposit_paid: '1000.25',
        notes: 'Specializes in seasonal flowers'
      })
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Elegant Flowers');
    expect(result[0].category).toEqual('Florist');
    expect(result[0].contact_person).toEqual('Jane Smith');
    expect(result[0].email).toEqual('jane@elegantflowers.com');
    expect(result[0].phone).toEqual('+1-555-0101');
    expect(result[0].website).toEqual('https://elegantflowers.com');
    expect(result[0].address).toEqual('123 Main St, Springfield, IL');
    expect(result[0].service_description).toEqual('Wedding bouquets and centerpieces');
    expect(result[0].contract_amount).toEqual(2500.50);
    expect(result[0].deposit_paid).toEqual(1000.25);
    expect(result[0].notes).toEqual('Specializes in seasonal flowers');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should fetch multiple vendors', async () => {
    // Create multiple test vendors
    await db.insert(vendorsTable)
      .values([
        {
          name: 'Elegant Flowers',
          category: 'Florist',
          contact_person: 'Jane Smith',
          email: 'jane@elegantflowers.com',
          phone: '+1-555-0101',
          website: 'https://elegantflowers.com',
          address: '123 Main St, Springfield, IL',
          service_description: 'Wedding bouquets and centerpieces',
          contract_amount: '2500.50',
          deposit_paid: '1000.25',
          notes: 'Specializes in seasonal flowers'
        },
        {
          name: 'Dream Photography',
          category: 'Photography',
          contact_person: 'John Doe',
          email: 'john@dreamphotography.com',
          phone: '+1-555-0102',
          website: 'https://dreamphotography.com',
          address: '456 Oak Ave, Springfield, IL',
          service_description: 'Wedding photography and videography',
          contract_amount: '3750.00',
          deposit_paid: null,
          notes: 'Available for destination weddings'
        }
      ])
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(2);
    
    // Verify first vendor
    const florist = result.find(v => v.category === 'Florist');
    expect(florist).toBeDefined();
    expect(florist!.name).toEqual('Elegant Flowers');
    expect(florist!.contract_amount).toEqual(2500.50);
    expect(florist!.deposit_paid).toEqual(1000.25);

    // Verify second vendor
    const photographer = result.find(v => v.category === 'Photography');
    expect(photographer).toBeDefined();
    expect(photographer!.name).toEqual('Dream Photography');
    expect(photographer!.contract_amount).toEqual(3750.00);
    expect(photographer!.deposit_paid).toBeNull();
  });

  it('should handle vendors with null optional fields', async () => {
    // Create vendor with minimal data
    await db.insert(vendorsTable)
      .values({
        name: 'Sweet Treats Bakery',
        category: 'Bakery',
        contact_person: null,
        email: null,
        phone: '+1-555-0103',
        website: null,
        address: null,
        service_description: null,
        contract_amount: null,
        deposit_paid: null,
        notes: null
      })
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Sweet Treats Bakery');
    expect(result[0].category).toEqual('Bakery');
    expect(result[0].contact_person).toBeNull();
    expect(result[0].email).toBeNull();
    expect(result[0].phone).toEqual('+1-555-0103');
    expect(result[0].website).toBeNull();
    expect(result[0].address).toBeNull();
    expect(result[0].service_description).toBeNull();
    expect(result[0].contract_amount).toBeNull();
    expect(result[0].deposit_paid).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should correctly convert numeric fields', async () => {
    // Create vendor with various numeric values
    await db.insert(vendorsTable)
      .values({
        name: 'Test Vendor',
        category: 'Testing',
        contact_person: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        service_description: null,
        contract_amount: '12345.67',
        deposit_paid: '890.12',
        notes: null
      })
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(1);
    expect(typeof result[0].contract_amount).toBe('number');
    expect(typeof result[0].deposit_paid).toBe('number');
    expect(result[0].contract_amount).toEqual(12345.67);
    expect(result[0].deposit_paid).toEqual(890.12);
  });

  it('should return vendors ordered by creation time', async () => {
    // Create vendors with a small delay to ensure different timestamps
    await db.insert(vendorsTable)
      .values({
        name: 'First Vendor',
        category: 'Category A',
        contact_person: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        service_description: null,
        contract_amount: null,
        deposit_paid: null,
        notes: null
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(vendorsTable)
      .values({
        name: 'Second Vendor',
        category: 'Category B',
        contact_person: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        service_description: null,
        contract_amount: null,
        deposit_paid: null,
        notes: null
      })
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('First Vendor');
    expect(result[1].name).toEqual('Second Vendor');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle vendors with mixed null and non-null numeric values', async () => {
    // Create vendors with different numeric field combinations
    await db.insert(vendorsTable)
      .values([
        {
          name: 'Vendor A',
          category: 'Category A',
          contact_person: null,
          email: null,
          phone: null,
          website: null,
          address: null,
          service_description: null,
          contract_amount: '1000.00',
          deposit_paid: null,
          notes: null
        },
        {
          name: 'Vendor B',
          category: 'Category B',
          contact_person: null,
          email: null,
          phone: null,
          website: null,
          address: null,
          service_description: null,
          contract_amount: null,
          deposit_paid: '500.75',
          notes: null
        }
      ])
      .execute();

    const result = await getVendors();

    expect(result).toHaveLength(2);
    
    const vendorA = result.find(v => v.name === 'Vendor A');
    expect(vendorA!.contract_amount).toEqual(1000.00);
    expect(vendorA!.deposit_paid).toBeNull();
    
    const vendorB = result.find(v => v.name === 'Vendor B');
    expect(vendorB!.contract_amount).toBeNull();
    expect(vendorB!.deposit_paid).toEqual(500.75);
  });
});