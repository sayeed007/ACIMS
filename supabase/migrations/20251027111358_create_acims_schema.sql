/*
  # ACIMS Database Schema - Complete System

  ## Overview
  This migration creates the complete database schema for the Automated Canteen & Inventory Management System.
  
  ## New Tables
  
  ### User Management
  - `departments` - Organization departments
  - `profiles` - Extended user profiles with roles and department assignment
  
  ### HR & Attendance
  - `shifts` - Work shifts configuration
  - `meal_sessions` - Daily meal sessions (up to 9 per day)
  - `attendance` - Daily attendance records with OT tracking
  - `eligibility_rules` - Rules engine for meal access
  
  ### Meal Access
  - `devices` - Biometric face recognition devices
  - `meal_events` - Real-time meal access logs from devices
  - `guest_meals` - Guest meal requests and approvals
  
  ### Inventory
  - `item_categories` - Item categorization
  - `items` - Inventory items with thresholds
  - `stock_movements` - All inventory transactions
  - `reconciliations` - Periodic stock reconciliation records
  
  ### Procurement
  - `vendors` - Vendor master data
  - `demands` - Purchase demands/requests
  - `demand_items` - Line items for demands
  - `purchase_orders` - Purchase orders
  - `po_items` - PO line items
  - `bills` - Vendor bills and invoices
  
  ### System
  - `audit_logs` - Complete audit trail
  - `notifications` - In-app notifications
  
  ## Security
  - RLS enabled on all tables
  - Policies for role-based access (admin, store_keeper, canteen_manager, dept_head, purchase_committee, hr)
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  code text UNIQUE,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  department_id uuid REFERENCES departments(id),
  employee_code text UNIQUE,
  is_vendor boolean DEFAULT false,
  phone text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Shifts
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Meal Sessions
CREATE TABLE IF NOT EXISTS meal_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  session_type text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  sort_order integer NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE meal_sessions ENABLE ROW LEVEL SECURITY;

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  shift_id uuid REFERENCES shifts(id),
  attendance_date date NOT NULL,
  status text NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  is_overtime boolean DEFAULT false,
  source text DEFAULT 'manual',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, attendance_date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- Eligibility Rules
CREATE TABLE IF NOT EXISTS eligibility_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  meal_session_id uuid NOT NULL REFERENCES meal_sessions(id),
  shift_id uuid REFERENCES shifts(id),
  requires_attendance boolean DEFAULT true,
  requires_overtime boolean DEFAULT false,
  department_id uuid REFERENCES departments(id),
  priority integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE eligibility_rules ENABLE ROW LEVEL SECURITY;

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  device_code text UNIQUE NOT NULL,
  location text,
  api_key text UNIQUE NOT NULL,
  status text DEFAULT 'active',
  last_sync timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Meal Events
CREATE TABLE IF NOT EXISTS meal_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  meal_session_id uuid NOT NULL REFERENCES meal_sessions(id),
  device_id uuid REFERENCES devices(id),
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  eligibility_status text NOT NULL,
  eligibility_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meal_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_meal_events_user ON meal_events(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_events_session ON meal_events(meal_session_id);
CREATE INDEX IF NOT EXISTS idx_meal_events_timestamp ON meal_events(event_timestamp);

-- Guest Meals
CREATE TABLE IF NOT EXISTS guest_meals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id uuid NOT NULL REFERENCES departments(id),
  requester_id uuid NOT NULL REFERENCES profiles(id),
  meal_session_id uuid NOT NULL REFERENCES meal_sessions(id),
  guest_count integer NOT NULL,
  meal_date date NOT NULL,
  purpose text,
  status text DEFAULT 'pending',
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE guest_meals ENABLE ROW LEVEL SECURITY;

-- Item Categories
CREATE TABLE IF NOT EXISTS item_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL UNIQUE,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;

-- Items
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  category_id uuid REFERENCES item_categories(id),
  unit text NOT NULL,
  min_threshold numeric(10,2) DEFAULT 0,
  current_stock numeric(10,2) DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id uuid NOT NULL REFERENCES items(id),
  movement_type text NOT NULL,
  quantity numeric(10,2) NOT NULL,
  unit_cost numeric(10,2),
  total_cost numeric(12,2),
  reference_type text,
  reference_id uuid,
  movement_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stock_movements_item ON stock_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(movement_date);

-- Reconciliations
CREATE TABLE IF NOT EXISTS reconciliations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_date date NOT NULL,
  item_id uuid NOT NULL REFERENCES items(id),
  system_stock numeric(10,2) NOT NULL,
  physical_stock numeric(10,2) NOT NULL,
  difference numeric(10,2) NOT NULL,
  notes text,
  reconciled_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reconciliations ENABLE ROW LEVEL SECURITY;

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  payment_terms text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Demands
CREATE TABLE IF NOT EXISTS demands (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_number text UNIQUE NOT NULL,
  created_by uuid NOT NULL REFERENCES profiles(id),
  department_id uuid REFERENCES departments(id),
  demand_date date NOT NULL DEFAULT CURRENT_DATE,
  required_by_date date,
  status text DEFAULT 'draft',
  notes text,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

-- Demand Items
CREATE TABLE IF NOT EXISTS demand_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  demand_id uuid NOT NULL REFERENCES demands(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  quantity numeric(10,2) NOT NULL,
  estimated_cost numeric(10,2),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demand_items ENABLE ROW LEVEL SECURITY;

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_number text UNIQUE NOT NULL,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  demand_id uuid REFERENCES demands(id),
  po_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'draft',
  created_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- PO Items
CREATE TABLE IF NOT EXISTS po_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  po_id uuid NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES items(id),
  quantity numeric(10,2) NOT NULL,
  unit_price numeric(10,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE po_items ENABLE ROW LEVEL SECURITY;

-- Bills
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number text UNIQUE NOT NULL,
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  po_id uuid REFERENCES purchase_orders(id),
  invoice_number text,
  invoice_date date,
  bill_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric(12,2) NOT NULL,
  status text DEFAULT 'pending',
  due_date date,
  paid_date date,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES profiles(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- RLS Policies

-- Departments
CREATE POLICY "Departments readable by authenticated users"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Departments manageable by admins"
  ON departments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Departments updatable by admins"
  ON departments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "Departments deletable by admins"
  ON departments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- Profiles
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    id = auth.uid() OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'hr', 'canteen_manager')
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- Shifts
CREATE POLICY "Shifts readable by authenticated"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Shifts manageable by admins"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr', 'canteen_manager')
    )
  );

CREATE POLICY "Shifts updatable by admins"
  ON shifts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr', 'canteen_manager')
    )
  );

-- Meal Sessions
CREATE POLICY "Meal sessions readable by authenticated"
  ON meal_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Meal sessions insertable by managers"
  ON meal_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

CREATE POLICY "Meal sessions updatable by managers"
  ON meal_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

-- Attendance
CREATE POLICY "Users can view attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr', 'canteen_manager', 'dept_head')
    )
  );

CREATE POLICY "HR can insert attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

CREATE POLICY "HR can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'hr')
    )
  );

-- Eligibility Rules
CREATE POLICY "Eligibility rules readable by authenticated"
  ON eligibility_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Eligibility rules insertable by managers"
  ON eligibility_rules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

CREATE POLICY "Eligibility rules updatable by managers"
  ON eligibility_rules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

-- Devices
CREATE POLICY "Devices readable by staff"
  ON devices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager', 'hr')
    )
  );

CREATE POLICY "Devices insertable by admins"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

CREATE POLICY "Devices updatable by admins"
  ON devices FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager')
    )
  );

-- Meal Events
CREATE POLICY "Users can view meal events"
  ON meal_events FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'canteen_manager', 'hr', 'dept_head')
    )
  );

CREATE POLICY "System can create meal events"
  ON meal_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Guest Meals
CREATE POLICY "Users can view guest meals"
  ON guest_meals FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (p.role IN ('admin', 'canteen_manager', 'dept_head') OR p.department_id = guest_meals.department_id)
    )
  );

CREATE POLICY "Users can request guest meals"
  ON guest_meals FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Dept heads can approve guest meals"
  ON guest_meals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'dept_head', 'canteen_manager')
    )
  );

-- Items & Categories
CREATE POLICY "Items readable by authenticated"
  ON items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Items insertable by store staff"
  ON items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'canteen_manager')
    )
  );

CREATE POLICY "Items updatable by store staff"
  ON items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'canteen_manager')
    )
  );

CREATE POLICY "Categories readable by authenticated"
  ON item_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Categories insertable by store staff"
  ON item_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'canteen_manager')
    )
  );

-- Stock Movements
CREATE POLICY "Stock movements readable by staff"
  ON stock_movements FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'canteen_manager')
    )
  );

CREATE POLICY "Stock movements insertable by store keeper"
  ON stock_movements FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper')
    )
  );

-- Reconciliations
CREATE POLICY "Reconciliations readable by staff"
  ON reconciliations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'canteen_manager')
    )
  );

CREATE POLICY "Reconciliations insertable by store keeper"
  ON reconciliations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper')
    )
  );

CREATE POLICY "Reconciliations updatable by store keeper"
  ON reconciliations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper')
    )
  );

-- Vendors
CREATE POLICY "Vendors readable by staff"
  ON vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
    )
  );

CREATE POLICY "Vendors insertable by authorized users"
  ON vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee')
    )
  );

-- Demands
CREATE POLICY "Users can view demands"
  ON demands FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
    )
  );

CREATE POLICY "Users can create demands"
  ON demands FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Authorized users can update demands"
  ON demands FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee')
    )
  );

-- Demand Items
CREATE POLICY "Demand items readable"
  ON demand_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM demands
      WHERE demands.id = demand_items.demand_id
      AND (
        demands.created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
        )
      )
    )
  );

CREATE POLICY "Demand items insertable"
  ON demand_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM demands
      JOIN profiles ON profiles.id = auth.uid()
      WHERE demands.id = demand_items.demand_id
      AND (demands.created_by = auth.uid() OR profiles.role IN ('admin', 'store_keeper', 'purchase_committee'))
    )
  );

-- Purchase Orders
CREATE POLICY "POs readable by authorized users"
  ON purchase_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
    )
  );

CREATE POLICY "POs insertable by purchase committee"
  ON purchase_orders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee')
    )
  );

CREATE POLICY "POs updatable by purchase committee"
  ON purchase_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee')
    )
  );

-- PO Items
CREATE POLICY "PO items readable"
  ON po_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
    )
  );

CREATE POLICY "PO items insertable by purchase committee"
  ON po_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee')
    )
  );

-- Bills
CREATE POLICY "Bills readable by authorized users"
  ON bills FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'store_keeper', 'purchase_committee', 'canteen_manager')
    )
  );

CREATE POLICY "Bills insertable by authorized users"
  ON bills FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee', 'store_keeper')
    )
  );

CREATE POLICY "Bills updatable by authorized users"
  ON bills FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'purchase_committee', 'store_keeper')
    )
  );

-- Audit Logs
CREATE POLICY "Audit logs readable by admins"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);