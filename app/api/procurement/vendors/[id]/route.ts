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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    await connectDB()

    const vendor = await Vendor.findOne({
      _id: id,
      isDeleted: false,
    }).lean()

    if (!vendor) {
      return notFoundError('Vendor not found')
    }

    return successResponse(vendor)
  } catch (error: any) {
    console.error('Get vendor error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to fetch vendor', null, 500)
  }
}

/**
 * PUT /api/procurement/vendors/:id - Update vendor
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    const body = await request.json()
    await connectDB()

    // Find the vendor
    const vendor = await Vendor.findOne({
      _id: id,
      isDeleted: false,
    })

    if (!vendor) {
      return notFoundError('Vendor not found')
    }

    // Check if vendor code is being changed and if it already exists
    if (body.vendorCode && body.vendorCode.toUpperCase() !== vendor.vendorCode) {
      const existingVendor = await Vendor.findOne({
        vendorCode: body.vendorCode.toUpperCase(),
        _id: { $ne: id },
        isDeleted: false,
      })

      if (existingVendor) {
        return validationError('Vendor code already exists')
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

    return successResponse(vendor)
  } catch (error: any) {
    console.error('Update vendor error:', error)

    if (error.name === 'ValidationError') {
      return validationError(error.message, error.errors)
    }

    if (error.code === 11000) {
      return validationError('Vendor code already exists')
    }

    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to update vendor', null, 500)
  }
}

/**
 * DELETE /api/procurement/vendors/:id - Soft delete vendor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401)
    }

    const { id } = await params
    await connectDB()

    const vendor = await Vendor.findOne({
      _id: id,
      isDeleted: false,
    })

    if (!vendor) {
      return notFoundError('Vendor not found')
    }

    // Mark as deleted (soft delete)
    vendor.isDeleted = true
    await vendor.save()

    return successResponse({ message: 'Vendor deleted successfully' })
  } catch (error: any) {
    console.error('Delete vendor error:', error)
    return errorResponse('INTERNAL_ERROR', error.message || 'Failed to delete vendor', null, 500)
  }
}
