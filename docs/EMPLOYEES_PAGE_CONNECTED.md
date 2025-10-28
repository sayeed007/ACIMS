# ✅ Employees Page - Fully Connected!

## What's Been Built

I've successfully connected the Employees page to your backend APIs with full CRUD operations, role-based access controls, and real-time data fetching.

## Files Created/Modified

### New Files Created:

1. **hooks/useEmployees.ts**
   - Custom React Query hooks for employee operations
   - `useEmployees()` - Fetch employees with filters
   - `useEmployee()` - Fetch single employee
   - `useCreateEmployee()` - Create new employee
   - `useUpdateEmployee()` - Update existing employee
   - `useDeleteEmployee()` - Delete employee (soft delete)
   - `useEmployeeStats()` - Fetch employee statistics

2. **components/employees/employee-form-dialog.tsx**
   - Modal dialog for creating/editing employees
   - Form validation with react-hook-form
   - Dynamic dropdowns for departments and shifts
   - Support for all employee fields:
     - Employee ID, Name, Email, Phone
     - Department, Shift, Employee Type
     - Date of Joining, Blood Group

### Modified Files:

1. **app/employees/page.tsx**
   - Replaced mock data with real API integration
   - Added loading states with spinners
   - Added error handling with user-friendly messages
   - Added empty state when no employees exist
   - Integrated role-based access controls
   - Added real-time statistics cards
   - Implemented CRUD operations:
     - ✅ Create employee (Add Employee button)
     - ✅ Read employees (table with search)
     - ✅ Update employee (Edit button)
     - ✅ Delete employee (Delete button with confirmation)

## Features Implemented

### 🔐 Role-Based Access Control
The page now checks user permissions before showing action buttons:
- **Create**: Only ADMIN, SUPER_ADMIN, HR_ADMIN can create employees
- **Edit**: Only ADMIN, SUPER_ADMIN, HR_ADMIN can edit employees
- **Delete**: Only ADMIN, SUPER_ADMIN, HR_ADMIN can delete employees

Permissions are checked using:
```typescript
const canCreateEmployee = hasPermission('employee:create') ||
  user?.role === 'ADMIN' ||
  user?.role === 'SUPER_ADMIN' ||
  user?.role === 'HR_ADMIN'
```

### 📊 Real-Time Statistics
The stats cards now show live data:
- **Total Employees**: Total count of all employees
- **Active Employees**: Count of active employees with percentage
- **Vendor Staff**: Count of contract/vendor employees

### 🔍 Search Functionality
The search bar is connected to the API and filters employees in real-time by:
- Employee ID
- Name
- Email

### 📝 Full CRUD Operations

#### Create Employee
1. Click "Add Employee" button (top right)
2. Fill in the form with required fields:
   - Employee ID (required, unique)
   - Name (required)
   - Department (required, dropdown populated from API)
   - Shift (required, dropdown populated from API)
   - Employee Type (required, dropdown: Permanent, Contract, Temporary, Vendor Staff)
   - Date of Joining (required)
   - Email (optional, validated)
   - Phone (optional)
   - Blood Group (optional, dropdown)
3. Click "Create Employee"
4. Success toast notification appears
5. Employee list refreshes automatically

#### Edit Employee
1. Click the pencil icon (✏️) next to an employee
2. Form opens pre-filled with employee data
3. Modify fields as needed
4. Click "Update Employee"
5. Success toast notification appears
6. Employee list refreshes automatically

#### Delete Employee
1. Click the trash icon (🗑️) next to an employee
2. Confirmation dialog appears
3. Click "Delete" to confirm
4. Success toast notification appears
5. Employee list refreshes automatically

### 🎨 UI States

#### Loading State
Shows a spinner with "Loading employees..." message while fetching data.

#### Error State
Shows a red alert box with error message if the API request fails.

#### Empty State
When no employees exist:
- Shows user icon
- Displays "No employees found" message
- Shows "Add Employee" button to create the first employee

When search returns no results:
- Shows "Try adjusting your search query" message

## How to Test

### Prerequisites

1. **MongoDB must be running**:
   ```bash
   # If using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest

   # Or start your local MongoDB service
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Navigate to**: http://localhost:3000

### Test Steps

#### 1. Login as Admin
   - Go to http://localhost:3000/login
   - Use credentials: admin@acims.com / admin123
   - Or register a new admin user at http://localhost:3000/register

#### 2. Navigate to Employees Page
   - Click "Employees" in the sidebar
   - Or go directly to http://localhost:3000/employees

#### 3. Test Statistics Cards
   - Verify the stats cards show real numbers (might be 0 initially)
   - Create an employee and watch the numbers update

#### 4. Test Create Employee

**Before creating an employee, you MUST create a department and shift first!**

##### Create a Department:
   ```bash
   curl -X POST http://localhost:3000/api/departments \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "name": "Engineering",
       "code": "ENG",
       "description": "Engineering Department"
     }'
   ```

##### Create a Shift:
   ```bash
   curl -X POST http://localhost:3000/api/shifts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "name": "Morning Shift",
       "code": "MS",
       "startTime": "09:00",
       "endTime": "18:00"
     }'
   ```

##### Now create an employee via UI:
   a. Click "Add Employee" button
   b. Fill in the form:
      - Employee ID: EMP001
      - Name: John Doe
      - Email: john@company.com
      - Phone: +91 98765 43210
      - Department: Select from dropdown
      - Shift: Select from dropdown
      - Employee Type: Permanent
      - Date of Joining: Select date
      - Blood Group: O+ (optional)
   c. Click "Create Employee"
   d. Verify success toast appears
   e. Verify employee appears in the table

#### 5. Test Search
   - Type "John" in the search bar
   - Verify the table filters to show only matching employees
   - Clear search to show all employees

#### 6. Test Edit Employee
   - Click the pencil icon next to an employee
   - Modify the name or email
   - Click "Update Employee"
   - Verify success toast appears
   - Verify changes appear in the table

#### 7. Test Delete Employee
   - Click the trash icon next to an employee
   - Verify confirmation dialog appears
   - Click "Delete"
   - Verify success toast appears
   - Verify employee is removed from the table

#### 8. Test Permissions (Optional)
   - Login as a different role (e.g., CANTEEN_MANAGER)
   - Navigate to employees page
   - Verify Create/Edit/Delete buttons are hidden
   - Only users with ADMIN, SUPER_ADMIN, or HR_ADMIN roles can perform CRUD operations

### API Endpoints Being Used

The employees page connects to these API endpoints:

1. **GET /api/employees** - Fetch employees list
   - Query params: `search`, `departmentId`, `shiftId`, `status`, `employeeType`, `page`, `limit`
   - Used by: Main table, statistics

2. **GET /api/employees/[id]** - Fetch single employee
   - Used by: Edit form (when needed)

3. **POST /api/employees** - Create new employee
   - Used by: Add Employee dialog

4. **PUT /api/employees/[id]** - Update employee
   - Used by: Edit Employee dialog

5. **DELETE /api/employees/[id]** - Delete employee (soft delete)
   - Used by: Delete confirmation dialog

6. **GET /api/departments** - Fetch departments
   - Used by: Department dropdown in form

7. **GET /api/shifts** - Fetch shifts
   - Used by: Shift dropdown in form

## Code Structure

### Data Flow

```
User Action → Component → Custom Hook → API Client → Backend API
                ↓                              ↓
           React Query ← ← ← ← ← ← ← ← Response
                ↓
        Update UI + Toast Notification
```

### Example: Creating an Employee

1. User clicks "Add Employee" → `handleCreateEmployee()` opens dialog
2. User fills form → Form validation with react-hook-form
3. User submits → `useCreateEmployee()` hook called
4. Hook calls → `api.createEmployee(data)` in API client
5. API client sends → POST request to `/api/employees` with JWT token
6. Backend processes → Creates employee in MongoDB
7. Backend responds → Success response with created employee
8. React Query → Invalidates `['employees']` cache
9. React Query → Refetches employees list automatically
10. UI updates → New employee appears in table
11. Toast → Shows success message

### Type Safety

All API responses and employee data are fully typed:

```typescript
interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  email?: string;
  phone?: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  shift: {
    _id: string;
    name: string;
    code: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';
  employeeType: 'PERMANENT' | 'CONTRACT' | 'TEMPORARY' | 'VENDOR_STAFF';
  dateOfJoining: string;
  // ... other fields
}
```

## Troubleshooting

### Issue: Dropdowns are empty in Add Employee form

**Cause**: No departments or shifts exist in the database

**Solution**: Create departments and shifts first using the API:

```bash
# Create a department
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Engineering",
    "code": "ENG"
  }'

# Create a shift
curl -X POST http://localhost:3000/api/shifts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Morning Shift",
    "code": "MS",
    "startTime": "09:00",
    "endTime": "18:00"
  }'
```

### Issue: "Authentication required" error

**Cause**: Not logged in or token expired

**Solution**:
1. Go to http://localhost:3000/login
2. Login with your credentials
3. Token is stored in localStorage automatically

### Issue: "Employee ID already exists" error

**Cause**: Duplicate employee ID

**Solution**: Each employee must have a unique employee ID (e.g., EMP001, EMP002, etc.)

### Issue: Statistics show 0 even after creating employees

**Cause**: Statistics cache is stale

**Solution**: Refresh the page or wait 60 seconds (cache duration)

## Next Steps

Now that the Employees page is fully functional, you can:

1. **Connect other pages** using the same pattern:
   - Departments page
   - Shifts page
   - Meal Sessions page
   - Inventory page

2. **Add more features** to the Employees page:
   - Pagination (backend already supports it)
   - Advanced filters (by department, shift, status, type)
   - Excel export
   - Excel import
   - Bulk operations

3. **Create similar hooks** for other entities:
   - `hooks/useDepartments.ts`
   - `hooks/useShifts.ts`
   - `hooks/useMealSessions.ts`

4. **Add more role-based controls**:
   - Update `components/layout/side-nav.tsx` to hide menu items based on role
   - Add permission checks to other pages

## Example: Replicating for Departments Page

To connect the Departments page, follow this pattern:

1. Create `hooks/useDepartments.ts` (similar to useEmployees.ts)
2. Create `components/departments/department-form-dialog.tsx`
3. Update `app/departments/page.tsx` with:
   - `useDepartments()` hook
   - Loading/error/empty states
   - CRUD operations
   - Role-based access controls

You can use the employees page code as a template!

## Summary

✅ Employees page is fully connected to backend APIs
✅ Full CRUD operations working
✅ Role-based access controls implemented
✅ Real-time statistics
✅ Search functionality
✅ Loading, error, and empty states
✅ Form validation
✅ Toast notifications
✅ Type-safe API calls

**The Employees page is now ALIVE with real data!** 🎉

Test it out and see your data management in action. You can now create, view, update, and delete employees through a beautiful, responsive UI connected to your MongoDB backend.
