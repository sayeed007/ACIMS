import NumberSequence from '@/lib/db/models/NumberSequence';
import connectDB from '@/lib/db/mongoose';

export type EntityType = 'BILL' | 'DEMAND' | 'PURCHASE_ORDER' | 'STOCK_MOVEMENT' | 'EMPLOYEE' | 'VENDOR';

/**
 * Generate the next number for a given entity type
 * @param entityType - The type of entity (BILL, DEMAND, etc.)
 * @returns The generated number string (e.g., "BILL-000001")
 */
export async function generateNextNumber(entityType: EntityType): Promise<string> {
  await connectDB();

  // Find and increment the sequence atomically
  const sequence = await NumberSequence.findOneAndUpdate(
    { entityType, isActive: true },
    { $inc: { currentNumber: 1 } },
    { new: true, upsert: false }
  );

  if (!sequence) {
    throw new Error(`Number sequence not configured for ${entityType}`);
  }

  // Format the number with leading zeros
  const paddedNumber = sequence.currentNumber.toString().padStart(sequence.length, '0');

  // Replace placeholders in format string
  const generatedNumber = sequence.format
    .replace('{PREFIX}', sequence.prefix)
    .replace('{NUMBER}', paddedNumber);

  return generatedNumber;
}

/**
 * Initialize default number sequences for all entity types
 */
export async function initializeDefaultSequences() {
  await connectDB();

  const defaultSequences = [
    {
      entityType: 'BILL',
      prefix: 'BILL',
      length: 6,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Bill Number Sequence',
      isActive: true,
    },
    {
      entityType: 'DEMAND',
      prefix: 'DEM',
      length: 6,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Purchase Demand Number Sequence',
      isActive: true,
    },
    {
      entityType: 'PURCHASE_ORDER',
      prefix: 'PO',
      length: 6,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Purchase Order Number Sequence',
      isActive: true,
    },
    {
      entityType: 'STOCK_MOVEMENT',
      prefix: 'SM',
      length: 6,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Stock Movement Reference Number Sequence',
      isActive: true,
    },
    {
      entityType: 'EMPLOYEE',
      prefix: 'EMP',
      length: 5,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Employee ID Sequence',
      isActive: true,
    },
    {
      entityType: 'VENDOR',
      prefix: 'VEN',
      length: 5,
      currentNumber: 0,
      format: '{PREFIX}-{NUMBER}',
      description: 'Vendor Code Sequence',
      isActive: true,
    },
  ];

  for (const seq of defaultSequences) {
    await NumberSequence.findOneAndUpdate(
      { entityType: seq.entityType },
      { $setOnInsert: seq },
      { upsert: true, new: true }
    );
  }

  console.log('Default number sequences initialized');
}

/**
 * Preview the next number without incrementing
 * @param entityType - The type of entity
 * @returns The next number that would be generated
 */
export async function previewNextNumber(entityType: EntityType): Promise<string> {
  await connectDB();

  const sequence = await NumberSequence.findOne({ entityType, isActive: true });

  if (!sequence) {
    throw new Error(`Number sequence not configured for ${entityType}`);
  }

  const nextNumber = sequence.currentNumber + 1;
  const paddedNumber = nextNumber.toString().padStart(sequence.length, '0');

  const previewNumber = sequence.format
    .replace('{PREFIX}', sequence.prefix)
    .replace('{NUMBER}', paddedNumber);

  return previewNumber;
}

/**
 * Get current sequence configuration
 * @param entityType - The type of entity
 * @returns The sequence configuration
 */
export async function getSequenceConfig(entityType: EntityType) {
  await connectDB();

  const sequence = await NumberSequence.findOne({ entityType });
  return sequence;
}

/**
 * Update sequence configuration
 * @param entityType - The type of entity
 * @param updates - The fields to update
 */
export async function updateSequenceConfig(
  entityType: EntityType,
  updates: {
    prefix?: string;
    length?: number;
    format?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  await connectDB();

  const sequence = await NumberSequence.findOneAndUpdate(
    { entityType },
    { $set: updates },
    { new: true }
  );

  if (!sequence) {
    throw new Error(`Number sequence not found for ${entityType}`);
  }

  return sequence;
}

/**
 * Reset sequence to a specific number
 * @param entityType - The type of entity
 * @param resetTo - The number to reset to
 */
export async function resetSequence(entityType: EntityType, resetTo: number = 0) {
  await connectDB();

  const sequence = await NumberSequence.findOneAndUpdate(
    { entityType },
    { $set: { currentNumber: resetTo } },
    { new: true }
  );

  if (!sequence) {
    throw new Error(`Number sequence not found for ${entityType}`);
  }

  return sequence;
}
