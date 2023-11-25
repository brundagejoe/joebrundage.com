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
      quotes: {
        Row: {
          associated_user_id: number | null
          author: string
          created_at: string
          date: string
          id: number
          note: string | null
          quote: string
        }
        Insert: {
          associated_user_id?: number | null
          author: string
          created_at?: string
          date: string
          id?: number
          note?: string | null
          quote: string
        }
        Update: {
          associated_user_id?: number | null
          author?: string
          created_at?: string
          date?: string
          id?: number
          note?: string | null
          quote?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_associated_user_id_fkey"
            columns: ["associated_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          id: number
          password_hash: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: number
          password_hash: string
          username: string
        }
        Update: {
          created_at?: string
          id?: number
          password_hash?: string
          username?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
