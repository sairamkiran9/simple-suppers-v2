export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_user_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: unknown | null
          new_data: Json | null
          old_data: Json | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: unknown | null
          new_data?: Json | null
          old_data?: Json | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_activity_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_pricing_rules: {
        Row: {
          base_price_per_day: number
          bulk_discount_percentage: number | null
          created_at: string | null
          created_by: string | null
          duration_days: number
          final_price: number
          id: string
          is_active: boolean | null
          provider_share_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          base_price_per_day: number
          bulk_discount_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          duration_days: number
          final_price: number
          id?: string
          is_active?: boolean | null
          provider_share_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price_per_day?: number
          bulk_discount_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          duration_days?: number
          final_price?: number
          id?: string
          is_active?: boolean | null
          provider_share_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_pricing_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_days: {
        Row: {
          created_at: string | null
          day_number: number
          day_title: string | null
          id: string
          meal_plan_id: string | null
        }
        Insert: {
          created_at?: string | null
          day_number: number
          day_title?: string | null
          id?: string
          meal_plan_id?: string | null
        }
        Update: {
          created_at?: string | null
          day_number?: number
          day_title?: string | null
          id?: string
          meal_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_days_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_providers: {
        Row: {
          average_rating: number | null
          bio: string | null
          business_name: string
          created_at: string | null
          email_verified: boolean | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          profile_image_url: string | null
          total_earnings: number | null
          total_plans: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          business_name: string
          created_at?: string | null
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          profile_image_url?: string | null
          total_earnings?: number | null
          total_plans?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          business_name?: string
          created_at?: string | null
          email_verified?: boolean | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          profile_image_url?: string | null
          total_earnings?: number | null
          total_plans?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_reviews: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_verified_purchase: boolean | null
          meal_plan_id: string | null
          purchase_id: string | null
          rating: number
          review_text: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_verified_purchase?: boolean | null
          meal_plan_id?: string | null
          purchase_id?: string | null
          rating: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_verified_purchase?: boolean | null
          meal_plan_id?: string | null
          purchase_id?: string | null
          rating?: number
          review_text?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_reviews_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_reviews_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_plan_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          average_rating: number | null
          category: string | null
          created_at: string | null
          description: string
          dietary_tags: string[] | null
          difficulty_level: string | null
          duration_days: number
          duration_type: string
          final_price: number
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          provider_id: string | null
          rating_count: number | null
          suggested_price: number
          title: string
          total_purchases: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          description: string
          dietary_tags?: string[] | null
          difficulty_level?: string | null
          duration_days: number
          duration_type: string
          final_price: number
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          provider_id?: string | null
          rating_count?: number | null
          suggested_price: number
          title: string
          total_purchases?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          category?: string | null
          created_at?: string | null
          description?: string
          dietary_tags?: string[] | null
          difficulty_level?: string | null
          duration_days?: number
          duration_type?: string
          final_price?: number
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          provider_id?: string | null
          rating_count?: number | null
          suggested_price?: number
          title?: string
          total_purchases?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          cook_time_minutes: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          ingredients: string
          instructions: string
          meal_name: string
          meal_plan_day_id: string | null
          meal_type: string
          nutritional_info: Json | null
          prep_time_minutes: number | null
          servings: number | null
        }
        Insert: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients: string
          instructions: string
          meal_name: string
          meal_plan_day_id?: string | null
          meal_type: string
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
        }
        Update: {
          cook_time_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string
          instructions?: string
          meal_name?: string
          meal_plan_day_id?: string | null
          meal_type?: string
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_day_id_fkey"
            columns: ["meal_plan_day_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_days"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          meal_plan_id: string | null
          metadata: Json | null
          provider_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          meal_plan_id?: string | null
          metadata?: Json | null
          provider_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          meal_plan_id?: string | null
          metadata?: Json | null
          provider_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_analytics_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_analytics_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          generated_at: string | null
          id: string
          ingredients_json: string
          list_type: string | null
          meal_plan_id: string | null
          pdf_url: string | null
          purchase_id: string | null
          user_id: string | null
        }
        Insert: {
          generated_at?: string | null
          id?: string
          ingredients_json: string
          list_type?: string | null
          meal_plan_id?: string | null
          pdf_url?: string | null
          purchase_id?: string | null
          user_id?: string | null
        }
        Update: {
          generated_at?: string | null
          id?: string
          ingredients_json?: string
          list_type?: string | null
          meal_plan_id?: string | null
          pdf_url?: string | null
          purchase_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "user_plan_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_plan_purchases: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          meal_plan_id: string | null
          platform_fee: number
          provider_earnings: number
          provider_id: string | null
          purchase_price: number
          purchased_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          meal_plan_id?: string | null
          platform_fee: number
          provider_earnings: number
          provider_id?: string | null
          purchase_price: number
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          meal_plan_id?: string | null
          platform_fee?: number
          provider_earnings?: number
          provider_id?: string | null
          purchase_price?: number
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_purchases_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plan_purchases_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "meal_plan_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_plan_purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          auth_provider: string | null
          created_at: string | null
          dietary_preferences: string[] | null
          email: string
          free_plans_used: number | null
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          name: string
          subscription_tier: string | null
          updated_at: string | null
          user_type: string | null
        }
        Insert: {
          auth_provider?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          email: string
          free_plans_used?: number | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_type?: string | null
        }
        Update: {
          auth_provider?: string | null
          created_at?: string | null
          dietary_preferences?: string[] | null
          email?: string
          free_plans_used?: number | null
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          name?: string
          subscription_tier?: string | null
          updated_at?: string | null
          user_type?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

