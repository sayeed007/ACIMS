import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import InventoryItem from '@/lib/db/models/InventoryItem';
import { getCurrentUser } from '@/lib/utils/auth-helpers';
import * as XLSX from 'xlsx';

/**
 * GET /api/inventory/items/export
 * Export inventory items to Excel
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock');

    // Build query
    const query: any = { isDeleted: false };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { itemCode: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query['category.name'] = category;
    }

    if (status) {
      query.status = status;
    }

    if (lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$reorderLevel'] };
    }

    // Fetch inventory items
    const items = await InventoryItem.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Prepare data for Excel
    const exportData = items.map((item: any, index: number) => ({
      '#': index + 1,
      'Item Code': item.itemCode,
      'Item Name': item.name,
      'Description': item.description || '-',
      'Category': item.category?.name || '-',
      'Unit': item.unit,
      'Current Stock': item.currentStock || 0,
      'Reorder Level': item.reorderLevel || 0,
      'Reorder Quantity': item.reorderQuantity || '-',
      'Avg Cost Per Unit': item.avgCostPerUnit || 0,
      'Total Value': item.totalValue || 0,
      'Storage Location': item.storageLocation || '-',
      'Shelf Life (days)': item.shelfLife || '-',
      'Status': item.status,
      'Low Stock': (item.currentStock <= item.reorderLevel) ? 'Yes' : 'No',
      'Created At': item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-',
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 5 },  // #
      { wch: 12 }, // Item Code
      { wch: 25 }, // Item Name
      { wch: 30 }, // Description
      { wch: 15 }, // Category
      { wch: 10 }, // Unit
      { wch: 15 }, // Current Stock
      { wch: 15 }, // Reorder Level
      { wch: 17 }, // Reorder Quantity
      { wch: 18 }, // Avg Cost Per Unit
      { wch: 15 }, // Total Value
      { wch: 20 }, // Storage Location
      { wch: 18 }, // Shelf Life
      { wch: 12 }, // Status
      { wch: 12 }, // Low Stock
      { wch: 15 }, // Created At
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Items');

    // Create summary sheet
    const lowStockItems = items.filter((item: any) => item.currentStock <= item.reorderLevel);
    const totalValue = items.reduce((sum: number, item: any) => sum + (item.totalValue || 0), 0);

    const summaryData = [
      { Metric: 'Total Items', Value: items.length },
      { Metric: 'Active Items', Value: items.filter((i: any) => i.status === 'ACTIVE').length },
      { Metric: 'Inactive Items', Value: items.filter((i: any) => i.status === 'INACTIVE').length },
      { Metric: 'Low Stock Items', Value: lowStockItems.length },
      { Metric: 'Total Stock Value (INR)', Value: totalValue.toFixed(2) },
      { Metric: 'Export Date', Value: new Date().toLocaleString() },
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="inventory_items_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Export inventory items error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to export inventory items' },
      },
      { status: 500 }
    );
  }
}
