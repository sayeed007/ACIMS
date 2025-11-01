# Troubleshooting Guide: API Data Not Loading Issues

## Problem Overview
Data exists in the database (confirmed via seed scripts) but API endpoints return empty responses or the frontend cannot display the data properly.

---

## Issue 1: Double-Wrapped API Responses (Empty `{}` Response)

### Symptoms
- API endpoint returns `{}` instead of proper JSON response
- Works in some routes (e.g., `/api/inventory/items`) but not others (e.g., `/api/inventory/movements`)
- Network tab shows 200 OK status but empty response body

### Root Cause
The API route handlers were **double-wrapping** responses. The helper functions `successResponse()` and `errorResponse()` in `lib/utils/api-response.ts` already return `NextResponse.json()`, but the route handlers were wrapping them again.

### Example of Incorrect Code
```typescript
// ❌ WRONG - Double wrapping
export async function GET(request: NextRequest) {
  try {
    const data = await Model.find();
    return NextResponse.json(
      successResponse(data),  // successResponse already returns NextResponse
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('ERROR', 'Failed', null, 500),
      { status: 500 }
    );
  }
}
```

### Correct Code
```typescript
// ✅ CORRECT - No double wrapping
export async function GET(request: NextRequest) {
  try {
    const data = await Model.find();
    return successResponse(data);  // Returns NextResponse directly
  } catch (error) {
    return errorResponse('ERROR', 'Failed', null, 500);
  }
}
```

### How to Fix
1. **Locate the API route file** (e.g., `app/api/inventory/movements/route.ts`)
2. **Find all return statements** using `successResponse()` or `errorResponse()`
3. **Remove the outer `NextResponse.json()` wrapper**
4. **Remove the separate `{ status: xxx }` parameter** (already included in helper functions)

### Files That Need This Fix
Check these patterns in your API routes:
- `app/api/**/route.ts` - Main route handlers (GET, POST, PUT, DELETE)
- `app/api/**/[id]/route.ts` - Dynamic route handlers

---

## Issue 2: Mongoose Model Middleware Conflicts

### Symptoms
- Query returns no results even though data exists in database
- Works for some models but not others
- `isDeleted: false` filter causes empty results

### Root Cause
The Mongoose model schema had `isDeleted` field with `select: false`, which excludes it from queries by default. However, the pre-find middleware tried to filter by this field, causing the query to fail silently.

### Example of Problematic Schema
```typescript
// ❌ WRONG - select: false conflicts with middleware
const schema = new Schema({
  // ... other fields
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,  // ❌ This prevents querying by isDeleted
  },
});

// Pre-find middleware tries to use isDeleted but it's not selected
schema.pre(/^find/, function (next) {
  // @ts-ignore
  this.find({ isDeleted: { $ne: true } });  // ❌ Won't work!
  next();
});
```

### Correct Schema Configuration
```typescript
// ✅ CORRECT - Remove select: false
const schema = new Schema({
  // ... other fields
  isDeleted: {
    type: Boolean,
    default: false,
    // No select: false
  },
});

// Improved pre-find middleware
schema.pre(/^find/, function (next) {
  const query = this.getQuery();
  if (!('isDeleted' in query)) {
    this.where({ isDeleted: false });
  }
  next();
});
```

### How to Fix
1. **Open the model file** (e.g., `lib/db/models/StockMovement.ts`)
2. **Find the `isDeleted` field definition**
3. **Remove `select: false`** from the field options
4. **Update the pre-find middleware** to check if isDeleted is already in the query
5. **Don't manually add `isDeleted: false`** in route queries (middleware handles it)

### Files That Need This Fix
- `lib/db/models/*.ts` - All model files with soft delete functionality

---

## Issue 3: React Hook Form Select Components Not Working

### Symptoms
- Select dropdown appears but shows "Select..." placeholder even after selection
- Form data missing select field values on submit
- Console shows validation errors about required fields
- API returns 400 Bad Request with "field is required" error

### Root Cause
Shadcn UI's Select component is **not automatically registered** with React Hook Form. The component uses a controlled pattern that requires manual integration with the form state.

### Example of Incorrect Code
```tsx
// ❌ WRONG - Select not registered with form
const { register, setValue, watch } = useForm();
const selectedValue = watch('fieldName');

<Select
  value={selectedValue}
  onValueChange={(value) => setValue('fieldName', value)}
>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
```

### Correct Code
```tsx
// ✅ CORRECT - Hidden input registers the field
const { register, setValue, watch } = useForm();
const selectedValue = watch('fieldName');

{/* Hidden input to register with react-hook-form */}
<input
  type="hidden"
  {...register('fieldName', { required: 'This field is required' })}
/>
<Select
  value={selectedValue || undefined}  // undefined for empty state
  onValueChange={(value) => {
    setValue('fieldName', value, {
      shouldValidate: true,
      shouldDirty: true
    });
  }}
>
  <SelectTrigger className={errors.fieldName ? 'border-red-500' : ''}>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
  </SelectContent>
</Select>
{errors.fieldName && (
  <p className="text-sm text-red-600">{errors.fieldName.message}</p>
)}
```

### Key Points
1. **Hidden input**: Uses `{...register('fieldName', { validation })}` to register the field
2. **value prop**: Use `selectedValue || undefined` (Select doesn't work with empty strings)
3. **onValueChange**: Call `setValue()` with validation flags
4. **Error display**: Show validation errors below the Select
5. **Error styling**: Add red border when there's an error

### How to Fix
1. **Locate the form component** (e.g., `components/inventory/stock-movement-form-dialog.tsx`)
2. **Find all `<Select>` components** that should be part of the form
3. **Add hidden input** above each Select with proper registration
4. **Update value prop** to use `|| undefined`
5. **Update onValueChange** to include validation flags
6. **Add error display** below the Select

### Common Select Fields to Check
- Item/Entity selection dropdowns
- Status/Type selection dropdowns
- Category/Classification dropdowns
- Any required dropdown that submits to an API

---

## Quick Diagnosis Checklist

Use this checklist to diagnose similar issues:

### API Returns Empty `{}`
- [ ] Check if route uses `NextResponse.json()` wrapper around helper functions
- [ ] Verify helper functions are imported from `lib/utils/api-response.ts`
- [ ] Test the endpoint with curl/Postman to see actual response
- [ ] Check browser DevTools Network tab for response payload

### API Returns No Data (Empty Array)
- [ ] Verify data exists in database (check seed output or MongoDB)
- [ ] Check if model has `isDeleted` field with `select: false`
- [ ] Look for pre-find middleware that filters by `isDeleted`
- [ ] Remove manual `isDeleted: false` from queries
- [ ] Test query directly in MongoDB/Mongoose

### Form Submit Returns 400 Error
- [ ] Check browser console for form data being sent
- [ ] Verify all required fields have values
- [ ] Check if Select components have hidden inputs
- [ ] Look for validation errors in React Hook Form
- [ ] Test API endpoint directly with valid data
- [ ] Check API route validation logic

---

## Testing Your Fixes

### 1. Test API Endpoint Directly
```bash
# Test with curl
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/your-endpoint

# Expected: JSON response with data array
# Actual (if broken): {}
```

### 2. Test in Browser DevTools
1. Open Network tab
2. Trigger the API call from UI
3. Check Response tab for actual data
4. Check Preview tab for parsed JSON

### 3. Test Form Submission
1. Open Console tab
2. Fill out form
3. Look for "Submitting..." console.log with data
4. Check if all fields are included
5. Verify data types (number vs string)

### 4. Verify Database
```javascript
// In MongoDB shell or Compass
db.stockmovements.find({ isDeleted: false }).limit(5)
```

---

## Prevention Tips

### For New API Routes
1. **Use helper functions correctly**: Never wrap `successResponse()` in `NextResponse.json()`
2. **Copy from working routes**: Use existing routes as templates
3. **Test immediately**: Test with curl before testing in UI

### For New Models
1. **Avoid `select: false` on filter fields**: Don't hide fields you need to query
2. **Smart middleware**: Check if field exists in query before filtering
3. **Consistent patterns**: Use same soft-delete pattern across all models

### For New Forms with Select
1. **Always use hidden input**: Register all Select fields with hidden inputs
2. **Handle undefined properly**: Use `|| undefined` for empty values
3. **Enable validation**: Add validation rules and error display
4. **Test empty state**: Ensure form validates before allowing submit

---

## Related Files Reference

### API Response Helpers
- `lib/utils/api-response.ts` - Response helper functions (DO NOT wrap these)

### Models with Soft Delete
- `lib/db/models/StockMovement.ts`
- `lib/db/models/InventoryItem.ts`
- `lib/db/models/Reconciliation.ts`
- (Check other models for similar patterns)

### Form Components with Selects
- `components/inventory/stock-movement-form-dialog.tsx`
- `components/inventory/inventory-item-form-dialog.tsx`
- (Check other form dialogs)

### Working API Route Examples
- `app/api/inventory/items/route.ts` - ✅ Correct implementation
- `app/api/inventory/movements/route.ts` - ✅ Fixed implementation

---

## Version History

**v1.0** - 2025-10-31
- Initial documentation
- Covers stock movements API and form issues
- Three main issue categories documented

---

## Need Help?

If you encounter similar issues:
1. Check this guide first
2. Look at working examples in the codebase
3. Compare broken code with working code
4. Test each layer (API → Frontend → Form) separately
