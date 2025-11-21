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
  useCreateBill,
  useUpdateBill,
  type Bill,
} from '@/hooks/useBills'
import { useVendors } from '@/hooks/useVendors'
import { useInventoryItems } from '@/hooks/useInventoryItems'
import { format } from 'date-fns'

interface BillFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bill?: Bill | null
  mode: 'create' | 'edit'
}

interface BillFormData {
  billNumber: string
  billDate: string
  dueDate: string
  vendorId: string
  vendorCode: string
  vendorName: string
  items: Array<{
    description: string
    itemId?: string
    itemCode?: string
    itemName?: string
    quantity?: number
    unit?: string
    rate: number
    amount: number
  }>
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'POSTED'
  notes?: string
}

export function BillFormDialog({
  open,
  onOpenChange,
  bill,
  mode,
}: BillFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useCreateBill()
  const updateMutation = useUpdateBill()
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
  } = useForm<BillFormData>({
    defaultValues: {
      billNumber: '',
      billDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: '',
      vendorId: '',
      vendorCode: '',
      vendorName: '',
      items: [],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
      paidAmount: 0,
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
  const taxAmount = watch('tax')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && bill) {
        reset({
          billNumber: bill.billNumber,
          billDate: format(new Date(bill.billDate), 'yyyy-MM-dd'),
          dueDate: format(new Date(bill.dueDate), 'yyyy-MM-dd'),
          vendorId: bill.vendor.id,
          vendorCode: bill.vendor.vendorCode,
          vendorName: bill.vendor.name,
          items: bill.items.map((item: any) => ({
            description: item.description,
            itemId: item.item?.id,
            itemCode: item.item?.itemCode,
            itemName: item.item?.name,
            quantity: item.quantity,
            unit: item.unit,
            rate: item.rate,
            amount: item.amount,
          })),
          subtotal: (bill as any).subtotal || 0,
          tax: (bill as any).tax || 0,
          totalAmount: bill.totalAmount,
          paidAmount: bill.paidAmount,
          status: bill.status,
          notes: (bill as any).notes,
        })
      } else {
        reset({
          billNumber: '',
          billDate: format(new Date(), 'yyyy-MM-dd'),
          dueDate: '',
          vendorId: '',
          vendorCode: '',
          vendorName: '',
          items: [],
          subtotal: 0,
          tax: 0,
          totalAmount: 0,
          paidAmount: 0,
          status: 'DRAFT',
          notes: '',
        })
      }
    }
  }, [open, mode, bill, reset])

  const handleVendorSelect = (vendorId: string) => {
    const selectedVendor = vendors.find((vendor: any) => vendor._id === vendorId)
    if (selectedVendor) {
      setValue('vendorId', selectedVendor._id)
      setValue('vendorCode', selectedVendor.vendorCode)
      setValue('vendorName', selectedVendor.name)
    }
  }

  const addItem = () => {
    append({
      description: '',
      itemId: '',
      itemCode: '',
      itemName: '',
      quantity: 0,
      unit: '',
      rate: 0,
      amount: 0,
    })
  }

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((item: any) => item._id === itemId)
    if (selectedItem) {
      setValue(`items.${index}.itemId`, selectedItem._id)
      setValue(`items.${index}.itemCode`, selectedItem.itemCode)
      setValue(`items.${index}.itemName`, selectedItem.name)
      setValue(`items.${index}.unit`, selectedItem.unit)
      setValue(`items.${index}.description`, selectedItem.name)
      setValue(`items.${index}.rate`, selectedItem.avgCostPerUnit || 0)
    }
  }

  const calculateItemAmount = (index: number) => {
    const quantity = watch(`items.${index}.quantity`) || 0
    const rate = watch(`items.${index}.rate`) || 0
    const amount = quantity * rate
    setValue(`items.${index}.amount`, amount)
    return amount
  }

  const calculateSubtotal = () => {
    const items = watch('items') || []
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0)
    setValue('subtotal', subtotal)
    return subtotal
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const tax = watch('tax') || 0
    const total = subtotal + tax
    setValue('totalAmount', total)
    return total
  }

  // Update totals when items or tax change
  useEffect(() => {
    calculateTotal()
  }, [watch('items'), taxAmount])

  const onSubmit = async (data: BillFormData) => {
    if (data.items.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        // Only include billNumber when editing (for create, backend will auto-generate)
        ...(mode === 'edit' && bill?.billNumber ? { billNumber: bill.billNumber } : {}),
        billDate: new Date(data.billDate),
        dueDate: new Date(data.dueDate),
        vendor: {
          id: data.vendorId,
          vendorCode: data.vendorCode,
          name: data.vendorName,
        },
        items: data.items.map((item) => ({
          description: item.description,
          item: item.itemId ? {
            id: item.itemId,
            itemCode: item.itemCode,
            name: item.itemName,
          } : undefined,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
        })),
        subtotal: data.subtotal,
        tax: data.tax,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        status: data.status,
        notes: data.notes,
      }

      if (mode === 'edit' && bill) {
        await updateMutation.mutateAsync({ id: bill._id, data: payload })
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
            {mode === 'edit' ? 'Edit Bill' : 'Create New Bill'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update bill information'
              : 'Record a new vendor bill for payment'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="billNumber">Bill Number</Label>
              <Input
                id="billNumber"
                placeholder="Auto-generated by system"
                disabled
                className="bg-muted"
                value={mode === 'edit' ? bill?.billNumber : ''}
                readOnly
              />
              <p className="text-xs text-muted-foreground">
                ℹ️ Bill number will be automatically generated by the system
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billDate">
                Bill Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="billDate"
                type="date"
                {...register('billDate', { required: 'Bill date is required' })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate', { required: 'Due date is required' })}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600">{errors.dueDate.message}</p>
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
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="POSTED">Posted</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Bill Items <span className="text-red-500">*</span></Label>
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
                      <Label>Description <span className="text-red-500">*</span></Label>
                      <Input
                        {...register(`items.${index}.description`, { required: true })}
                        placeholder="Item description"
                      />
                    </div>

                    <div className="space-y-2 col-span-4">
                      <Label>Link to Inventory Item (Optional)</Label>
                      <Select
                        value={watch(`items.${index}.itemId`) || ''}
                        onValueChange={(value) => handleItemSelect(index, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select item (optional)" />
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
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        onBlur={() => calculateItemAmount(index)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input {...register(`items.${index}.unit`)} placeholder="e.g., kg, pcs" />
                    </div>

                    <div className="space-y-2">
                      <Label>Rate <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.rate`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                        onBlur={() => calculateItemAmount(index)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.amount`, { valueAsNumber: true })}
                        readOnly
                        className="bg-slate-50"
                      />
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
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-bold">₹{calculateSubtotal().toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="tax">Tax Amount:</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    className="w-48"
                    {...register('tax', { valueAsNumber: true })}
                  />
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-lg font-bold">Total Amount:</span>
                  <span className="text-lg font-bold text-green-600">
                    ₹{calculateTotal().toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4">
                  <Label htmlFor="paidAmount">Paid Amount:</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    className="w-48"
                    {...register('paidAmount', { valueAsNumber: true })}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this bill..."
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
              {mode === 'edit' ? 'Update Bill' : 'Create Bill'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
