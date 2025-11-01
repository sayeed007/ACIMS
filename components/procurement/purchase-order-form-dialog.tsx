'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
  type PurchaseOrder,
} from '@/hooks/usePurchaseOrders'
import { useVendors } from '@/hooks/useVendors'
import { useInventoryItems } from '@/hooks/useInventoryItems'
import { format } from 'date-fns'

interface PurchaseOrderFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: PurchaseOrder | null
  mode: 'create' | 'edit'
}

interface POFormData {
  poNumber: string
  poDate: string
  vendorId: string
  vendorCode: string
  vendorName: string
  vendorContact: string
  deliveryDate: string
  deliveryAddress?: string
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    quantity: number
    unit: string
    ratePerUnit: number
    taxPercent: number
  }>
  paymentTerms?: string
  status: 'DRAFT' | 'APPROVED' | 'SENT_TO_VENDOR' | 'PARTIALLY_RECEIVED' | 'FULLY_RECEIVED' | 'CANCELLED'
  notes?: string
}

export function PurchaseOrderFormDialog({
  open,
  onOpenChange,
  order,
  mode,
}: PurchaseOrderFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useCreatePurchaseOrder()
  const updateMutation = useUpdatePurchaseOrder()
  const { data: vendorsData } = useVendors({ limit: 1000, status: 'ACTIVE' })
  const { data: inventoryData } = useInventoryItems({ limit: 1000 })

  const vendors = vendorsData?.data || []
  const inventoryItems = inventoryData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<POFormData>({
    defaultValues: {
      poNumber: '',
      poDate: format(new Date(), 'yyyy-MM-dd'),
      vendorId: '',
      vendorCode: '',
      vendorName: '',
      vendorContact: '',
      deliveryDate: '',
      deliveryAddress: '',
      items: [],
      paymentTerms: '',
      status: 'DRAFT',
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedStatus = watch('status')
  const selectedVendorId = watch('vendorId')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && order) {
        reset({
          poNumber: order.poNumber,
          poDate: format(new Date(order.poDate), 'yyyy-MM-dd'),
          vendorId: order.vendor.id,
          vendorCode: order.vendor.vendorCode,
          vendorName: order.vendor.name,
          vendorContact: order.vendor.contact,
          deliveryDate: format(new Date(order.deliveryDate), 'yyyy-MM-dd'),
          deliveryAddress: (order as any).deliveryAddress,
          items: order.items.map((item: any) => ({
            itemId: item.item.id,
            itemCode: item.item.itemCode,
            itemName: item.item.name,
            quantity: item.quantity,
            unit: item.unit,
            ratePerUnit: item.ratePerUnit,
            taxPercent: item.taxPercent,
          })),
          paymentTerms: (order as any).paymentTerms,
          status: order.status,
          notes: (order as any).notes,
        })
      } else {
        reset({
          poNumber: '',
          poDate: format(new Date(), 'yyyy-MM-dd'),
          vendorId: '',
          vendorCode: '',
          vendorName: '',
          vendorContact: '',
          deliveryDate: '',
          deliveryAddress: '',
          items: [],
          paymentTerms: '',
          status: 'DRAFT',
          notes: '',
        })
      }
    }
  }, [open, mode, order, reset])

  const handleVendorSelect = (vendorId: string) => {
    const selectedVendor = vendors.find((vendor: any) => vendor._id === vendorId)
    if (selectedVendor) {
      setValue('vendorId', selectedVendor._id)
      setValue('vendorCode', selectedVendor.vendorCode)
      setValue('vendorName', selectedVendor.name)
      setValue('vendorContact', selectedVendor.contactPerson.phone)
    }
  }

  const addItem = () => {
    append({
      itemId: '',
      itemCode: '',
      itemName: '',
      quantity: 0,
      unit: '',
      ratePerUnit: 0,
      taxPercent: 0,
    })
  }

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((item: any) => item._id === itemId)
    if (selectedItem) {
      setValue(`items.${index}.itemId`, selectedItem._id)
      setValue(`items.${index}.itemCode`, selectedItem.itemCode)
      setValue(`items.${index}.itemName`, selectedItem.name)
      setValue(`items.${index}.unit`, selectedItem.unit)
      setValue(`items.${index}.ratePerUnit`, selectedItem.avgCostPerUnit || 0)
    }
  }

  const calculateItemTotal = (index: number) => {
    const quantity = watch(`items.${index}.quantity`) || 0
    const ratePerUnit = watch(`items.${index}.ratePerUnit`) || 0
    const taxPercent = watch(`items.${index}.taxPercent`) || 0

    const subtotal = quantity * ratePerUnit
    const taxAmount = (subtotal * taxPercent) / 100
    return subtotal + taxAmount
  }

  const calculateTotal = () => {
    const items = watch('items') || []
    return items.reduce((sum, item, index) => {
      const subtotal = (item.quantity || 0) * (item.ratePerUnit || 0)
      const taxAmount = (subtotal * (item.taxPercent || 0)) / 100
      return sum + subtotal + taxAmount
    }, 0)
  }

  const onSubmit = async (data: POFormData) => {
    if (data.items.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        poNumber: data.poNumber,
        poDate: new Date(data.poDate),
        vendor: {
          id: data.vendorId,
          vendorCode: data.vendorCode,
          name: data.vendorName,
          contact: data.vendorContact,
        },
        deliveryDate: new Date(data.deliveryDate),
        deliveryAddress: data.deliveryAddress,
        items: data.items.map((item) => ({
          item: {
            id: item.itemId,
            itemCode: item.itemCode,
            name: item.itemName,
          },
          quantity: item.quantity,
          unit: item.unit,
          ratePerUnit: item.ratePerUnit,
          taxPercent: item.taxPercent,
        })),
        paymentTerms: data.paymentTerms,
        status: data.status,
        notes: data.notes,
      }

      if (mode === 'edit' && order) {
        await updateMutation.mutateAsync({ id: order._id, data: payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      reset()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Purchase Order' : 'Create New Purchase Order'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update purchase order information'
              : 'Create a new purchase order for vendor supplies'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poNumber">
                PO Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="poNumber"
                placeholder="e.g., PO001"
                {...register('poNumber', { required: 'PO number is required' })}
              />
              {errors.poNumber && (
                <p className="text-sm text-red-600">{errors.poNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="poDate">PO Date</Label>
              <Input
                id="poDate"
                type="date"
                {...register('poDate', { required: 'PO date is required' })}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="vendor">
                Vendor <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedVendorId} onValueChange={handleVendorSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor: any) => (
                    <SelectItem key={vendor._id} value={vendor._id}>
                      {vendor.vendorCode} - {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendorId && (
                <p className="text-sm text-red-600">Vendor is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">
                Delivery Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                {...register('deliveryDate', { required: 'Delivery date is required' })}
              />
              {errors.deliveryDate && (
                <p className="text-sm text-red-600">{errors.deliveryDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setValue('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="SENT_TO_VENDOR">Sent to Vendor</SelectItem>
                  <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
                  <SelectItem value="FULLY_RECEIVED">Fully Received</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <Input
                id="deliveryAddress"
                placeholder="Enter delivery address"
                {...register('deliveryAddress')}
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input
                id="paymentTerms"
                placeholder="e.g., Net 30 days"
                {...register('paymentTerms')}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Items <span className="text-red-500">*</span></Label>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      onClick={() => remove(index)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-2 col-span-4">
                      <Label>Inventory Item <span className="text-red-500">*</span></Label>
                      <Select
                        value={watch(`items.${index}.itemId`)}
                        onValueChange={(value) => handleItemSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((item: any) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.itemCode} - {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input {...register(`items.${index}.unit`)} readOnly className="bg-slate-50" />
                    </div>

                    <div className="space-y-2">
                      <Label>Rate/Unit <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.ratePerUnit`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tax %</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.taxPercent`, { valueAsNumber: true })}
                      />
                    </div>

                    <div className="space-y-2 col-span-4">
                      <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                        <span className="text-sm font-medium">Item Total:</span>
                        <span className="text-sm font-bold">
                          ₹{calculateItemTotal(index).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground">No items added yet. Click "Add Item" to start.</p>
                </div>
              )}
            </div>

            {fields.length > 0 && (
              <div className="flex justify-end p-4 bg-slate-100 rounded-lg">
                <div className="text-right">
                  <span className="text-lg font-bold mr-2">Grand Total:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{calculateTotal().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this purchase order..."
              rows={3}
              {...register('notes')}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update PO' : 'Create PO'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
