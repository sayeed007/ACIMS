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
  useCreatePurchaseDemand,
  useUpdatePurchaseDemand,
  type PurchaseDemand,
} from '@/hooks/usePurchaseDemands'
import { useInventoryItems } from '@/hooks/useInventoryItems'
import { format } from 'date-fns'

interface DemandFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  demand?: PurchaseDemand | null
  mode: 'create' | 'edit'
}

interface DemandFormData {
  demandNumber: string
  demandDate: string
  requiredByDate: string
  generationType: 'AUTO' | 'MANUAL'
  items: Array<{
    itemId: string
    itemCode: string
    itemName: string
    currentStock: number
    requiredQuantity: number
    demandedQuantity: number
    unit: string
    remarks?: string
  }>
  finalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PO_CREATED'
  notes?: string
}

export function DemandFormDialog({
  open,
  onOpenChange,
  demand,
  mode,
}: DemandFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const createMutation = useCreatePurchaseDemand()
  const updateMutation = useUpdatePurchaseDemand()
  const { data: inventoryData } = useInventoryItems({ limit: 1000 })
  const inventoryItems = inventoryData?.data || []

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<DemandFormData>({
    defaultValues: {
      demandNumber: '',
      demandDate: format(new Date(), 'yyyy-MM-dd'),
      requiredByDate: '',
      generationType: 'MANUAL',
      items: [],
      finalStatus: 'DRAFT',
      notes: '',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const selectedGenerationType = watch('generationType')
  const selectedStatus = watch('finalStatus')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && demand) {
        reset({
          demandNumber: demand.demandNumber,
          demandDate: format(new Date(demand.demandDate), 'yyyy-MM-dd'),
          requiredByDate: format(new Date(demand.requiredByDate), 'yyyy-MM-dd'),
          generationType: demand.generationType,
          items: demand.items.map((item: any) => ({
            itemId: item.item.id,
            itemCode: item.item.itemCode,
            itemName: item.item.name,
            currentStock: item.currentStock,
            requiredQuantity: item.requiredQuantity,
            demandedQuantity: item.demandedQuantity,
            unit: item.unit,
            remarks: item.remarks,
          })),
          finalStatus: demand.finalStatus,
          notes: demand.notes,
        })
      } else {
        reset({
          demandNumber: '',
          demandDate: format(new Date(), 'yyyy-MM-dd'),
          requiredByDate: '',
          generationType: 'MANUAL',
          items: [],
          finalStatus: 'DRAFT',
          notes: '',
        })
      }
    }
  }, [open, mode, demand, reset])

  const addItem = () => {
    append({
      itemId: '',
      itemCode: '',
      itemName: '',
      currentStock: 0,
      requiredQuantity: 0,
      demandedQuantity: 0,
      unit: '',
      remarks: '',
    })
  }

  const handleItemSelect = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((item: any) => item._id === itemId)
    if (selectedItem) {
      setValue(`items.${index}.itemId`, selectedItem._id)
      setValue(`items.${index}.itemCode`, selectedItem.itemCode)
      setValue(`items.${index}.itemName`, selectedItem.name)
      setValue(`items.${index}.currentStock`, selectedItem.currentStock || 0)
      setValue(`items.${index}.unit`, selectedItem.unit)
    }
  }

  const onSubmit = async (data: DemandFormData) => {
    if (data.items.length === 0) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        demandNumber: data.demandNumber,
        demandDate: new Date(data.demandDate),
        requiredByDate: new Date(data.requiredByDate),
        generationType: data.generationType,
        items: data.items.map((item) => ({
          item: {
            id: item.itemId,
            itemCode: item.itemCode,
            name: item.itemName,
          },
          currentStock: item.currentStock,
          requiredQuantity: item.requiredQuantity,
          demandedQuantity: item.demandedQuantity,
          unit: item.unit,
          remarks: item.remarks,
        })),
        finalStatus: data.finalStatus,
        notes: data.notes,
      }

      if (mode === 'edit' && demand) {
        await updateMutation.mutateAsync({ id: demand._id, data: payload })
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
            {mode === 'edit' ? 'Edit Purchase Demand' : 'Create New Purchase Demand'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit'
              ? 'Update purchase demand information'
              : 'Create a new purchase requisition for inventory items'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="demandNumber">
                Demand Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="demandNumber"
                placeholder="e.g., DEM001"
                {...register('demandNumber', { required: 'Demand number is required' })}
              />
              {errors.demandNumber && (
                <p className="text-sm text-red-600">{errors.demandNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="demandDate">Demand Date</Label>
              <Input
                id="demandDate"
                type="date"
                {...register('demandDate', { required: 'Demand date is required' })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredByDate">
                Required By Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="requiredByDate"
                type="date"
                {...register('requiredByDate', { required: 'Required by date is required' })}
              />
              {errors.requiredByDate && (
                <p className="text-sm text-red-600">{errors.requiredByDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="generationType">Generation Type</Label>
              <Select
                value={selectedGenerationType}
                onValueChange={(value: any) => setValue('generationType', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MANUAL">Manual</SelectItem>
                  <SelectItem value="AUTO">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalStatus">Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: any) => setValue('finalStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SUBMITTED">Submitted</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                  <SelectItem value="PO_CREATED">PO Created</SelectItem>
                </SelectContent>
              </Select>
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

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-3">
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
                      <Label>Current Stock</Label>
                      <Input
                        type="number"
                        {...register(`items.${index}.currentStock`, { valueAsNumber: true })}
                        readOnly
                        className="bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Required Qty <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.requiredQuantity`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Demanded Qty <span className="text-red-500">*</span></Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.demandedQuantity`, {
                          required: true,
                          valueAsNumber: true,
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Input {...register(`items.${index}.unit`)} readOnly className="bg-slate-50" />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label>Remarks</Label>
                      <Input {...register(`items.${index}.remarks`)} placeholder="Optional remarks" />
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this demand..."
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
              {mode === 'edit' ? 'Update Demand' : 'Create Demand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
