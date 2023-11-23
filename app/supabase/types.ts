export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      quotes: {
        Row: {
          author: string | null;
          created_at: string;
          id: number;
          note: string | null;
          quote: string | null;
        };
        Insert: {
          author?: string | null;
          created_at?: string;
          id?: number;
          note?: string | null;
          quote?: string | null;
        };
        Update: {
          author?: string | null;
          created_at?: string;
          id?: number;
          note?: string | null;
          quote?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
