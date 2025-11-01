import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose';
import Vendor from '@/lib/db/models/Vendor'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/procurement/vendors - Get all vendors with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Build query
    const query: any = { isDeleted: false }

    if (category) {
      query.category = category
    }

    if (status) {
      query.status = status
    }

    // Search by name, vendor code, or contact person
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendorCode: { $regex: search, $options: 'i' } },
        { 'contactPerson.name': { $regex: search, $options: 'i' } },
        { 'contactPerson.email': { $regex: search, $options: 'i' } },
      ]
    }

    // Execute query with pagination
    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query),
    ])

    return successResponse(vendors, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Get vendors error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch vendors', null, 500)
  }
}

/**
 * POST /api/procurement/vendors - Create new vendor
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const body = await request.json()

    // Validate required fields
    if (!body.vendorCode || !body.name || !body.category) {
      return validationError('Vendor code, name, and category are required')
    }

    await connectDB()

    // Check if vendor code already exists
    const existingVendor = await Vendor.findOne({
      vendorCode: body.vendorCode.toUpperCase(),
      isDeleted: false,
    })

    if (existingVendor) {
      return validationError('Vendor code already exists')
    }

    // Create vendor
    const vendor = await Vendor.create({
      vendorCode: body.vendorCode.toUpperCase(),
      name: body.name,
      category: body.category,
      contactPerson: {
        name: body.contactPerson?.name || '',
        designation: body.contactPerson?.designation,
        phone: body.contactPerson?.phone || '',
        email: body.contactPerson?.email || '',
        alternatePhone: body.contactPerson?.alternatePhone,
      },
      address: {
        street: body.address?.street || '',
        city: body.address?.city || '',
        state: body.address?.state || '',
        pincode: body.address?.pincode || '',
        country: body.address?.country || 'India',
      },
      businessDetails: {
        gstNumber: body.businessDetails?.gstNumber,
        panNumber: body.businessDetails?.panNumber,
        registrationType: body.businessDetails?.registrationType,
        businessType: body.businessDetails?.businessType,
      },
      bankDetails: body.bankDetails,
      paymentTerms: {
        creditDays: body.paymentTerms?.creditDays || 0,
        paymentMode: body.paymentTerms?.paymentMode || 'NEFT',
        advancePercentage: body.paymentTerms?.advancePercentage,
      },
      rating: body.rating,
      status: body.status || 'ACTIVE',
      notes: body.notes,
      createdBy: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })

    return successResponse(vendor)
  } catch (error: any) {
    console.error('Create vendor error:', error)

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }

    if (error.code === 11000) {
      return validationError('Vendor code already exists')
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to create vendor', null, 500)
  }
}
