import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import * as XLSX from 'xlsx';
import mongoose from 'mongoose';

interface ImportRow {
  'Item Code (*)': string;
  'Item Name (*)': string;
  'Description': string;
  'Category (*)': string;
  'Unit (*)': string;
  'Current Stock': number | string;
  'Reorder Level': number | string;
  'Reorder Quantity': number | string;
  'Avg Cost Per Unit': number | string;
  'Storage Location': string;
  'Shelf Life (days)': number | string;
  'Status': string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: any;
}

/**
 * POST /api/inventory/items/bulk-import
 * Bulk import inventory items from Excel file
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Read the Excel file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: ImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No data found in file' } },
        { status: 400 }
      );
    }

    const validationErrors: ValidationError[] = [];
    const validItems: any[] = [];
    const existingItemCodes = new Set<string>();

    // Get all existing item codes (excluding soft-deleted items)
    const existingItems = await InventoryItem.find({ isDeleted: false }).select('itemCode').lean();
    existingItems.forEach((item: any) => {
      existingItemCodes.add(item.itemCode.toUpperCase());
    });

    // Validate and prepare items
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNumber = i + 2; // +2 because Excel is 1-indexed and has header row
      const errors: ValidationError[] = [];

      // Required field validation
      if (!row['Item Code (*)']) {
        errors.push({
          row: rowNumber,
          field: 'Item Code',
          message: 'Item Code is required',
        });
      }

      if (!row['Item Name (*)']) {
        errors.push({
          row: rowNumber,
          field: 'Item Name',
          message: 'Item Name is required',
        });
      }

      if (!row['Category (*)']) {
        errors.push({
          row: rowNumber,
          field: 'Category',
          message: 'Category is required',
        });
      }

      if (!row['Unit (*)']) {
        errors.push({
          row: rowNumber,
          field: 'Unit',
          message: 'Unit is required',
        });
      }

      // Skip further validation if required fields are missing
      if (errors.length > 0) {
        validationErrors.push(...errors);
        continue;
      }

      const itemCode = String(row['Item Code (*)']).trim().toUpperCase();
      const itemName = String(row['Item Name (*)']).trim();
      const category = String(row['Category (*)']).trim();
      const unit = String(row['Unit (*)']).trim().toUpperCase();

      // Check for duplicate item code in existing database
      if (existingItemCodes.has(itemCode)) {
        errors.push({
          row: rowNumber,
          field: 'Item Code',
          message: 'Item code already exists in database',
          value: itemCode,
        });
      }

      // Check for duplicate within this import batch
      const duplicateInBatch = validItems.find(item => item.itemCode === itemCode);
      if (duplicateInBatch) {
        errors.push({
          row: rowNumber,
          field: 'Item Code',
          message: 'Duplicate item code in this import file',
          value: itemCode,
        });
      }

      // Validate status
      const status = row['Status'] ? String(row['Status']).trim().toUpperCase() : 'ACTIVE';
      if (!['ACTIVE', 'INACTIVE'].includes(status)) {
        errors.push({
          row: rowNumber,
          field: 'Status',
          message: 'Status must be ACTIVE or INACTIVE',
          value: row['Status'],
        });
      }

      // Parse numeric fields
      const currentStock = row['Current Stock'] ? Number(row['Current Stock']) : 0;
      const reorderLevel = row['Reorder Level'] ? Number(row['Reorder Level']) : 0;
      const reorderQuantity = row['Reorder Quantity'] ? Number(row['Reorder Quantity']) : undefined;
      const avgCostPerUnit = row['Avg Cost Per Unit'] ? Number(row['Avg Cost Per Unit']) : 0;
      const shelfLife = row['Shelf Life (days)'] ? Number(row['Shelf Life (days)']) : undefined;

      // Validate numeric fields
      if (isNaN(currentStock) || currentStock < 0) {
        errors.push({
          row: rowNumber,
          field: 'Current Stock',
          message: 'Current Stock must be a non-negative number',
          value: row['Current Stock'],
        });
      }

      if (isNaN(reorderLevel) || reorderLevel < 0) {
        errors.push({
          row: rowNumber,
          field: 'Reorder Level',
          message: 'Reorder Level must be a non-negative number',
          value: row['Reorder Level'],
        });
      }

      if (reorderQuantity !== undefined && (isNaN(reorderQuantity) || reorderQuantity < 0)) {
        errors.push({
          row: rowNumber,
          field: 'Reorder Quantity',
          message: 'Reorder Quantity must be a non-negative number',
          value: row['Reorder Quantity'],
        });
      }

      if (isNaN(avgCostPerUnit) || avgCostPerUnit < 0) {
        errors.push({
          row: rowNumber,
          field: 'Avg Cost Per Unit',
          message: 'Avg Cost Per Unit must be a non-negative number',
          value: row['Avg Cost Per Unit'],
        });
      }

      if (shelfLife !== undefined && (isNaN(shelfLife) || shelfLife < 0)) {
        errors.push({
          row: rowNumber,
          field: 'Shelf Life',
          message: 'Shelf Life must be a non-negative number',
          value: row['Shelf Life (days)'],
        });
      }

      if (errors.length > 0) {
        validationErrors.push(...errors);
        continue;
      }

      // Calculate total value
      const totalValue = currentStock * avgCostPerUnit;

      // Add to valid items
      validItems.push({
        itemCode,
        name: itemName,
        description: row['Description'] ? String(row['Description']).trim() : undefined,
        category: {
          id: new mongoose.Types.ObjectId(), // Temporary ID until we have category management
          name: category,
        },
        unit,
        currentStock,
        reorderLevel,
        reorderQuantity,
        avgCostPerUnit,
        totalValue,
        storageLocation: row['Storage Location'] ? String(row['Storage Location']).trim() : undefined,
        shelfLife,
        status,
        createdBy: user._id,
        updatedBy: user._id,
      });
    }

    // If there are validation errors, return them
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `${validationErrors.length} validation error(s) found`,
            details: validationErrors,
          },
        },
        { status: 400 }
      );
    }

    // Insert valid items
    const createdItems = await InventoryItem.insertMany(validItems);

    return NextResponse.json({
      success: true,
      data: {
        total: data.length,
        imported: createdItems.length,
        failed: validationErrors.length,
        items: createdItems,
      },
    });
  } catch (error: any) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to import inventory items' },
      },
      { status: 500 }
    );
  }
}
