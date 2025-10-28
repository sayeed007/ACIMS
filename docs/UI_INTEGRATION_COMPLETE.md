# ✅ UI Integration Complete!

## What's Been Connected

### 🔐 Authentication System
- ✅ Login page at `/login`
- ✅ Register page at `/register`
- ✅ Auth context with `useAuth()` hook
- ✅ Protected routes
- ✅ JWT token management
- ✅ Automatic redirect logic

### 🎨 UI Updates
- ✅ Root layout with React Query + Auth providers
- ✅ Top nav shows user info and logout
- ✅ Protected dashboard layout
- ✅ Loading states
- ✅ Toast notifications with Sonner

### 📡 API Client
- ✅ Centralized API client (`lib/api-client.ts`)
- ✅ Automatic token management
- ✅ Type-safe API methods
- ✅ Error handling

## 🚀 How to Use

### 1. Start the Application

```bash
# Make sure MongoDB is running
# docker run -d -p 27017:27017 --name mongodb mongo:latest

# Run the dev server
npm run dev
```

### 2. Access the Application

Visit: **http://localhost:3000**

You'll be automatically redirected to `/login`

### 3. Create an Admin User

**Option A: Via UI (Register Page)**
1. Go to http://localhost:3000/register
2. Fill in the form:
   - Name: Admin User
   - Email: admin@acims.com
   - Password: admin123
   - Role: Administrator
3. Click "Create Account"
4. You'll be logged in automatically!

**Option B: Via API (curl)**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acims.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

### 4. Login

Use the credentials you just created or these demo users (after you create them):
- **Admin:** admin@acims.com / admin123
- **HR:** hr@acims.com / hr123
- **Manager:** manager@acims.com / manager123

## 📁 Updated Files

### New Files Created:
```
lib/
├── api-client.ts                      # API client
├── providers/
│   ├── query-provider.tsx             # React Query setup
│   └── auth-provider.tsx              # Auth context

app/
├── (auth)/
│   ├── login/page.tsx                 # Login page
│   └── register/page.tsx              # Register page

components/
└── layout/
    └── protected-route.tsx            # Protected route wrapper
```

### Modified Files:
```
app/
├── layout.tsx                         # Added providers
├── page.tsx                           # Auth-aware redirect
└── dashboard/layout.tsx               # Protected

components/layout/
└── top-nav.tsx                        # Shows user info, logout
```

## 🔗 API Integration Status

### ✅ Working APIs
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user
- `GET /api/employees` - List employees (with filters)
- `POST /api/employees` - Create employee
- `GET /api/employees/[id]` - Get single employee
- `PUT /api/employees/[id]` - Update employee
- `DELETE /api/employees/[id]` - Delete employee
- `GET /api/departments` - List departments
- `POST /api/departments` - Create department
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift
- `GET /api/meals/sessions` - List meal sessions
- `POST /api/meals/sessions` - Create meal session

### 📄 Pages Ready to Connect
The following pages have UI but need API integration:

1. **Employees Page** (`app/employees/page.tsx`)
   - Currently shows mock data
   - Ready to connect to `/api/employees`
   - Has table, search, filters

2. **Dashboard** (`app/dashboard/page.tsx`)
   - Shows static stats
   - Ready to connect to real-time data APIs

3. **Departments** (needs creation)
   - API exists: `/api/departments`
   - Create page similar to employees

4. **Shifts** (`app/shifts/page.tsx`)
   - API exists: `/api/shifts`
   - Connect similar to employees

5. **Meal Sessions** (`app/meal-sessions/page.tsx`)
   - API exists: `/api/meals/sessions`
   - Connect similar to employees

## 🎯 Next Steps to Fully Connect UI

### Step 1: Connect Employees Page (10 min)

Replace `app/employees/page.tsx` with:

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useState } from 'react';
// ... other imports

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch employees from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['employees', { search: searchQuery }],
    queryFn: () => api.getEmployees({ search: searchQuery }),
  });

  const employees = data?.data || [];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading employees</div>;

  return (
    // ... rest of your existing UI
    // Replace the mock employees array with {employees}
  );
}
```

### Step 2: Add Employee Creation Dialog (15 min)

Add a form dialog that calls:
```typescript
const createMutation = useMutation({
  mutationFn: (data) => api.createEmployee(data),
  onSuccess: () => {
    toast.success('Employee created!');
    queryClient.invalidateQueries(['employees']);
  },
});
```

### Step 3: Connect Dashboard Stats (15 min)

Create API endpoints for dashboard stats or use existing employee count:

```typescript
const { data: stats } = useQuery({
  queryKey: ['dashboard-stats'],
  queryFn: async () => {
    const [employees, meals] = await Promise.all([
      api.getEmployees({ status: 'ACTIVE' }),
      // Add meal stats API when ready
    ]);
    return {
      totalEmployees: employees.meta?.pagination?.total || 0,
      // ... other stats
    };
  },
});
```

### Step 4: Role-Based Navigation (20 min)

Update `components/layout/side-nav.tsx`:

```typescript
import { useAuth } from '@/lib/providers/auth-provider';

export function SideNav() {
  const { user, hasPermission } = useAuth();

  // Filter navigation based on role
  const filteredNav = navigation.filter(section => {
    // Define which roles can see which sections
    // Example:
    if (section.name === 'Procurement') {
      return hasPermission('procurement:read');
    }
    return true;
  });

  return // ... render filteredNav
}
```

## 🛠️ Helper Hooks

### useEmployees Hook Example

```typescript
// hooks/useEmployees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';

export function useEmployees(filters?: any) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => api.getEmployees(filters),
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.createEmployee,
    onSuccess: () => {
      toast.success('Employee created successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create employee');
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateEmployee(id, data),
    onSuccess: () => {
      toast.success('Employee updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update employee');
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.deleteEmployee,
    onSuccess: () => {
      toast.success('Employee deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete employee');
    },
  });
}
```

Then use in your component:
```typescript
const { data, isLoading } = useEmployees({ status: 'ACTIVE' });
const createMutation = useCreateEmployee();
const updateMutation = useUpdateEmployee();
const deleteMutation = useDeleteEmployee();
```

## 🎨 UI Patterns

### Loading State
```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900"></div>
        <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
```

### Error State
```typescript
if (error) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-900">Error loading data</p>
      <p className="text-sm text-red-700">{error.message}</p>
    </div>
  );
}
```

### Empty State
```typescript
if (!data || data.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Users className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 font-semibold">No employees found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Get started by creating a new employee
      </p>
      <Button className="mt-4" onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Employee
      </Button>
    </div>
  );
}
```

## 📊 Sample Integration: Employees Page

Here's a complete example showing how to connect the employees page:

1. **Install React Query Devtools** (optional, for debugging):
```typescript
// Already included in query-provider.tsx
```

2. **Create the connected page:**

```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useState } from 'react';
// ... other imports

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch employees
  const { data, isLoading } = useQuery({
    queryKey: ['employees', searchQuery],
    queryFn: () => api.getEmployees(searchQuery ? { search: searchQuery } : {}),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: api.deleteEmployee,
    onSuccess: () => {
      toast.success('Employee deleted');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const employees = data?.data || [];
  const pagination = data?.meta?.pagination;

  return (
    <div className="space-y-6">
      {/* Your existing UI */}
      <Table>
        <TableBody>
          {employees.map((employee) => (
            <TableRow key={employee._id}>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.department.name}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate(employee._id)}
                >
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

## 🎉 You're All Set!

Your backend APIs are connected to the UI through:
- ✅ Auth context for user management
- ✅ React Query for data fetching
- ✅ API client for type-safe requests
- ✅ Toast notifications for feedback
- ✅ Protected routes for security

**Start the app and login to see it in action!**

```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin account!

---

**For any issues, check:**
1. MongoDB is running
2. `.env.local` has correct values
3. Check browser console for errors
4. Check terminal for API errors
