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
          author: string | null
          created_at: string
          date: string | null
          id: number
          note: string | null
          quote: string | null
        }
        Insert: {
          author?: string | null
          created_at?: string
          date?: string | null
          id?: number
          note?: string | null
          quote?: string | null
        }
        Update: {
          author?: string | null
          created_at?: string
          date?: string | null
          id?: number
          note?: string | null
          quote?: string | null
        }
        Relationships: []
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
