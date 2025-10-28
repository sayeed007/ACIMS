export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      departments: {
        Row: {
          id: string
          name: string
          code: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: string
          department_id: string | null
          employee_code: string | null
          is_vendor: boolean
          phone: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name: string
          role?: string
          department_id?: string | null
          employee_code?: string | null
          is_vendor?: boolean
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: string
          department_id?: string | null
          employee_code?: string | null
          is_vendor?: boolean
          phone?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          name: string
          code: string
          start_time: string
          end_time: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          start_time: string
          end_time: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          start_time?: string
          end_time?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      meal_sessions: {
        Row: {
          id: string
          name: string
          session_type: string
          start_time: string
          end_time: string
          sort_order: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          session_type: string
          start_time: string
          end_time: string
          sort_order: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          session_type?: string
          start_time?: string
          end_time?: string
          sort_order?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          shift_id: string | null
          attendance_date: string
          status: string
          check_in_time: string | null
          check_out_time: string | null
          is_overtime: boolean
          source: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          shift_id?: string | null
          attendance_date: string
          status: string
          check_in_time?: string | null
          check_out_time?: string | null
          is_overtime?: boolean
          source?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          shift_id?: string | null
          attendance_date?: string
          status?: string
          check_in_time?: string | null
          check_out_time?: string | null
          is_overtime?: boolean
          source?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      eligibility_rules: {
        Row: {
          id: string
          name: string
          meal_session_id: string
          shift_id: string | null
          requires_attendance: boolean
          requires_overtime: boolean
          department_id: string | null
          priority: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          meal_session_id: string
          shift_id?: string | null
          requires_attendance?: boolean
          requires_overtime?: boolean
          department_id?: string | null
          priority?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          meal_session_id?: string
          shift_id?: string | null
          requires_attendance?: boolean
          requires_overtime?: boolean
          department_id?: string | null
          priority?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          name: string
          device_code: string
          location: string | null
          api_key: string
          status: string
          last_sync: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          device_code: string
          location?: string | null
          api_key: string
          status?: string
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          device_code?: string
          location?: string | null
          api_key?: string
          status?: string
          last_sync?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      meal_events: {
        Row: {
          id: string
          user_id: string
          meal_session_id: string
          device_id: string | null
          event_timestamp: string
          eligibility_status: string
          eligibility_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_session_id: string
          device_id?: string | null
          event_timestamp?: string
          eligibility_status: string
          eligibility_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meal_session_id?: string
          device_id?: string | null
          event_timestamp?: string
          eligibility_status?: string
          eligibility_reason?: string | null
          created_at?: string
        }
      }
      guest_meals: {
        Row: {
          id: string
          department_id: string
          requester_id: string
          meal_session_id: string
          guest_count: number
          meal_date: string
          purpose: string | null
          status: string
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          department_id: string
          requester_id: string
          meal_session_id: string
          guest_count: number
          meal_date: string
          purpose?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          department_id?: string
          requester_id?: string
          meal_session_id?: string
          guest_count?: number
          meal_date?: string
          purpose?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      item_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          code: string
          category_id: string | null
          unit: string
          min_threshold: number
          current_stock: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          category_id?: string | null
          unit: string
          min_threshold?: number
          current_stock?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          category_id?: string | null
          unit?: string
          min_threshold?: number
          current_stock?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          item_id: string
          movement_type: string
          quantity: number
          unit_cost: number | null
          total_cost: number | null
          reference_type: string | null
          reference_id: string | null
          movement_date: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          item_id: string
          movement_type: string
          quantity: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          movement_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          movement_type?: string
          quantity?: number
          unit_cost?: number | null
          total_cost?: number | null
          reference_type?: string | null
          reference_id?: string | null
          movement_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      reconciliations: {
        Row: {
          id: string
          reconciliation_date: string
          item_id: string
          system_stock: number
          physical_stock: number
          difference: number
          notes: string | null
          reconciled_by: string | null
          approved_by: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          reconciliation_date: string
          item_id: string
          system_stock: number
          physical_stock: number
          difference: number
          notes?: string | null
          reconciled_by?: string | null
          approved_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          reconciliation_date?: string
          item_id?: string
          system_stock?: number
          physical_stock?: number
          difference?: number
          notes?: string | null
          reconciled_by?: string | null
          approved_by?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          code: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          payment_terms: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          contact_person?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          payment_terms?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      demands: {
        Row: {
          id: string
          demand_number: string
          created_by: string
          department_id: string | null
          demand_date: string
          required_by_date: string | null
          status: string
          notes: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          demand_number: string
          created_by: string
          department_id?: string | null
          demand_date?: string
          required_by_date?: string | null
          status?: string
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          demand_number?: string
          created_by?: string
          department_id?: string | null
          demand_date?: string
          required_by_date?: string | null
          status?: string
          notes?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      demand_items: {
        Row: {
          id: string
          demand_id: string
          item_id: string
          quantity: number
          estimated_cost: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          demand_id: string
          item_id: string
          quantity: number
          estimated_cost?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          demand_id?: string
          item_id?: string
          quantity?: number
          estimated_cost?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      purchase_orders: {
        Row: {
          id: string
          po_number: string
          vendor_id: string
          demand_id: string | null
          po_date: string
          expected_delivery_date: string | null
          total_amount: number
          status: string
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          po_number: string
          vendor_id: string
          demand_id?: string | null
          po_date?: string
          expected_delivery_date?: string | null
          total_amount?: number
          status?: string
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          po_number?: string
          vendor_id?: string
          demand_id?: string | null
          po_date?: string
          expected_delivery_date?: string | null
          total_amount?: number
          status?: string
          created_by?: string | null
          approved_by?: string | null
          approved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      po_items: {
        Row: {
          id: string
          po_id: string
          item_id: string
          quantity: number
          unit_price: number
          total_price: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          po_id: string
          item_id: string
          quantity: number
          unit_price: number
          total_price: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          po_id?: string
          item_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          notes?: string | null
          created_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          bill_number: string
          vendor_id: string
          po_id: string | null
          invoice_number: string | null
          invoice_date: string | null
          bill_date: string
          amount: number
          status: string
          due_date: string | null
          paid_date: string | null
          verified_by: string | null
          verified_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_number: string
          vendor_id: string
          po_id?: string | null
          invoice_number?: string | null
          invoice_date?: string | null
          bill_date?: string
          amount: number
          status?: string
          due_date?: string | null
          paid_date?: string | null
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_number?: string
          vendor_id?: string
          po_id?: string | null
          invoice_number?: string | null
          invoice_date?: string | null
          bill_date?: string
          amount?: number
          status?: string
          due_date?: string | null
          paid_date?: string | null
          verified_by?: string | null
          verified_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          before_data: Json | null
          after_data: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          before_data?: Json | null
          after_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          before_data?: Json | null
          after_data?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          entity_type: string | null
          entity_id: string | null
          read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          entity_type?: string | null
          entity_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          entity_type?: string | null
          entity_id?: string | null
          read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
