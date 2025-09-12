import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          email: string | null
          insta_handle: string | null
          notes: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone?: string | null
          email?: string | null
          insta_handle?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          email?: string | null
          insta_handle?: string | null
          notes?: string | null
          tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          items: any[]
          total_amount: number
          due_date: string
          status: 'New' | 'In Progress' | 'Completed' | 'Paid'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          items: any[]
          total_amount: number
          due_date: string
          status?: 'New' | 'In Progress' | 'Completed' | 'Paid'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          items?: any[]
          total_amount?: number
          due_date?: string
          status?: 'New' | 'In Progress' | 'Completed' | 'Paid'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          customer_id: string
          order_id: string | null
          amount: number
          status: 'Unpaid' | 'Paid'
          pdf_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          customer_id: string
          order_id?: string | null
          amount: number
          status?: 'Unpaid' | 'Paid'
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          customer_id?: string
          order_id?: string | null
          amount?: number
          status?: 'Unpaid' | 'Paid'
          pdf_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
