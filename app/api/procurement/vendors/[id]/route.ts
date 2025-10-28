import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose';
import Vendor from '@/lib/db/models/Vendor'
import { successResponse, errorResponse, notFoundError, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * GET /api/procurement/vendors/:id - Get single vendor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const vendor = await Vendor.findOne({
      _id: params.id,
      isDeleted: false,
    }).lean()

    if (!vendor) {
      return NextResponse.json(
        notFoundError('Vendor not found'),
        { status: 404 }
      )
    }

    return NextResponse.json(successResponse(vendor))
  } catch (error: any) {
    console.error('Get vendor error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch vendor', null, 500),
      { status: 500 }
    )
  }
}

/**
 * PUT /api/procurement/vendors/:id - Update vendor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()
    await connectDB()

    // Find the vendor
    const vendor = await Vendor.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!vendor) {
      return NextResponse.json(
        notFoundError('Vendor not found'),
        { status: 404 }
      )
    }

    // Check if vendor code is being changed and if it already exists
    if (body.vendorCode && body.vendorCode.toUpperCase() !== vendor.vendorCode) {
      const existingVendor = await Vendor.findOne({
        vendorCode: body.vendorCode.toUpperCase(),
        _id: { $ne: params.id },
        isDeleted: false,
      })

      if (existingVendor) {
        return NextResponse.json(
          validationError('Vendor code already exists'),
          { status: 400 }
        )
      }
    }

    // Update vendor fields
    if (body.vendorCode !== undefined) {
      vendor.vendorCode = body.vendorCode.toUpperCase()
    }
    if (body.name !== undefined) {
      vendor.name = body.name
    }
    if (body.category !== undefined) {
      vendor.category = body.category
    }
    if (body.contactPerson !== undefined) {
      vendor.contactPerson = {
        name: body.contactPerson.name || vendor.contactPerson.name,
        designation: body.contactPerson.designation,
        phone: body.contactPerson.phone || vendor.contactPerson.phone,
        email: body.contactPerson.email || vendor.contactPerson.email,
        alternatePhone: body.contactPerson.alternatePhone,
      }
    }
    if (body.address !== undefined) {
      vendor.address = {
        street: body.address.street || vendor.address.street,
        city: body.address.city || vendor.address.city,
        state: body.address.state || vendor.address.state,
        pincode: body.address.pincode || vendor.address.pincode,
        country: body.address.country || vendor.address.country,
      }
    }
    if (body.businessDetails !== undefined) {
      vendor.businessDetails = {
        gstNumber: body.businessDetails.gstNumber,
        panNumber: body.businessDetails.panNumber,
        registrationType: body.businessDetails.registrationType,
        businessType: body.businessDetails.businessType,
      }
    }
    if (body.bankDetails !== undefined) {
      vendor.bankDetails = body.bankDetails
    }
    if (body.paymentTerms !== undefined) {
      vendor.paymentTerms = {
        creditDays: body.paymentTerms.creditDays ?? vendor.paymentTerms.creditDays,
        paymentMode: body.paymentTerms.paymentMode || vendor.paymentTerms.paymentMode,
        advancePercentage: body.paymentTerms.advancePercentage,
      }
    }
    if (body.rating !== undefined) {
      vendor.rating = body.rating
    }
    if (body.status !== undefined) {
      vendor.status = body.status
    }
    if (body.notes !== undefined) {
      vendor.notes = body.notes
    }

    await vendor.save()

    return NextResponse.json(successResponse(vendor))
  } catch (error: any) {
    console.error('Update vendor error:', error)

    if (error.name === 'ValidationError') {
      return NextResponse.json(
        validationError(error.message, error.errors),
        { status: 400 }
      )
    }

    if (error.code === 11000) {
      return NextResponse.json(
        validationError('Vendor code already exists'),
        { status: 400 }
      )
    }

    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to update vendor', null, 500),
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/procurement/vendors/:id - Soft delete vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    await connectDB()

    const vendor = await Vendor.findOne({
      _id: params.id,
      isDeleted: false,
    })

    if (!vendor) {
      return NextResponse.json(
        notFoundError('Vendor not found'),
        { status: 404 }
      )
    }

    // Mark as deleted (soft delete)
    vendor.isDeleted = true
    await vendor.save()

    return NextResponse.json(successResponse({ message: 'Vendor deleted successfully' }))
  } catch (error: any) {
    console.error('Delete vendor error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete vendor', null, 500),
      { status: 500 }
    )
  }
}
