import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import * as XLSX from 'xlsx';

/**
 * GET /api/inventory/items/template
 * Download Excel template for bulk inventory item import
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    // Sample data for template
    const sampleData = [
      {
        'Item Code (*)': 'ITM001',
        'Item Name (*)': 'Rice - Basmati',
        'Description': 'Premium quality basmati rice',
        'Category (*)': 'Grains',
        'Unit (*)': 'KG',
        'Current Stock': 500,
        'Reorder Level': 100,
        'Reorder Quantity': 200,
        'Avg Cost Per Unit': 80,
        'Storage Location': 'Warehouse A-1',
        'Shelf Life (days)': 365,
        'Status': 'ACTIVE',
      },
      {
        'Item Code (*)': 'ITM002',
        'Item Name (*)': 'Cooking Oil - Sunflower',
        'Description': 'Refined sunflower cooking oil',
        'Category (*)': 'Oils',
        'Unit (*)': 'LITER',
        'Current Stock': 200,
        'Reorder Level': 50,
        'Reorder Quantity': 100,
        'Avg Cost Per Unit': 150,
        'Storage Location': 'Warehouse A-2',
        'Shelf Life (days)': 180,
        'Status': 'ACTIVE',
      },
      {
        'Item Code (*)': 'ITM003',
        'Item Name (*)': 'Milk - Full Cream',
        'Description': 'Fresh full cream milk',
        'Category (*)': 'Dairy',
        'Unit (*)': 'LITER',
        'Current Stock': 100,
        'Reorder Level': 30,
        'Reorder Quantity': 50,
        'Avg Cost Per Unit': 60,
        'Storage Location': 'Cold Storage-1',
        'Shelf Life (days)': 7,
        'Status': 'ACTIVE',
      },
    ];

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Item Code
      { wch: 25 }, // Item Name
      { wch: 35 }, // Description
      { wch: 15 }, // Category
      { wch: 10 }, // Unit
      { wch: 15 }, // Current Stock
      { wch: 15 }, // Reorder Level
      { wch: 17 }, // Reorder Quantity
      { wch: 18 }, // Avg Cost Per Unit
      { wch: 20 }, // Storage Location
      { wch: 18 }, // Shelf Life
      { wch: 12 }, // Status
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Items');

    // Instructions sheet
    const instructions = [
      { Field: 'Item Code (*)', Description: 'Unique code for the item (e.g., ITM001). Will be converted to uppercase. Required.' },
      { Field: 'Item Name (*)', Description: 'Name of the inventory item. Required.' },
      { Field: 'Description', Description: 'Detailed description of the item. Optional.' },
      { Field: 'Category (*)', Description: 'Category name (e.g., Grains, Oils, Dairy, Vegetables, Spices). Required.' },
      { Field: 'Unit (*)', Description: 'Unit of measurement (e.g., KG, LITER, PIECE, GRAM, BOX). Will be converted to uppercase. Required.' },
      { Field: 'Current Stock', Description: 'Current quantity in stock. Default: 0. Optional.' },
      { Field: 'Reorder Level', Description: 'Minimum stock level before reorder. Default: 0. Optional.' },
      { Field: 'Reorder Quantity', Description: 'Quantity to order when stock is low. Optional.' },
      { Field: 'Avg Cost Per Unit', Description: 'Average cost per unit in INR. Default: 0. Optional.' },
      { Field: 'Storage Location', Description: 'Where the item is stored (e.g., Warehouse A-1, Cold Storage-1). Optional.' },
      { Field: 'Shelf Life (days)', Description: 'Number of days item remains usable. Optional.' },
      { Field: 'Status', Description: 'Status of item: ACTIVE or INACTIVE. Default: ACTIVE. Optional.' },
      { Field: '', Description: '' },
      { Field: '(*) = Required field', Description: 'Fields marked with (*) are mandatory' },
      { Field: 'Note', Description: 'Item codes must be unique. Duplicate codes will be rejected.' },
      { Field: 'Note', Description: 'Total Value is automatically calculated as: Current Stock × Avg Cost Per Unit' },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructions);
    instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="inventory_items_import_template.xlsx"',
      },
    });
  } catch (error: any) {
    console.error('Download template error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to download template' },
      },
      { status: 500 }
    );
  }
}
