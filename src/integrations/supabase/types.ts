export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      asset_statistics: {
        Row: {
          anomaly_events_count: number
          asset: string
          avg_anomaly_score: number
          avg_price: number
          created_at: string
          current_price: number
          id: string
          is_trending: boolean
          last_activity: string | null
          liquidation_count: number
          market_cap_category: string | null
          max_liquidation_amount: number
          price_change_24h: number
          ticker: string
          total_long_liquidations: number
          total_short_liquidations: number
          total_volume_24h: number
          updated_at: string
        }
        Insert: {
          anomaly_events_count?: number
          asset: string
          avg_anomaly_score?: number
          avg_price?: number
          created_at?: string
          current_price?: number
          id?: string
          is_trending?: boolean
          last_activity?: string | null
          liquidation_count?: number
          market_cap_category?: string | null
          max_liquidation_amount?: number
          price_change_24h?: number
          ticker: string
          total_long_liquidations?: number
          total_short_liquidations?: number
          total_volume_24h?: number
          updated_at?: string
        }
        Update: {
          anomaly_events_count?: number
          asset?: string
          avg_anomaly_score?: number
          avg_price?: number
          created_at?: string
          current_price?: number
          id?: string
          is_trending?: boolean
          last_activity?: string | null
          liquidation_count?: number
          market_cap_category?: string | null
          max_liquidation_amount?: number
          price_change_24h?: number
          ticker?: string
          total_long_liquidations?: number
          total_short_liquidations?: number
          total_volume_24h?: number
          updated_at?: string
        }
        Relationships: []
      }
      coin_trends: {
        Row: {
          amount: number
          anomaly_score: number
          ask: number | null
          asset: string
          bid: number | null
          change_24h: number
          close_price: number | null
          created_at: string
          daily_volume_impact: number
          exchange: string | null
          expires_at: string
          high_price: number | null
          id: string
          is_hidden: boolean
          is_micro_cap: boolean
          last_activity_hours: number
          low_price: number | null
          open_price: number | null
          price: number
          ticker: string
          trades_count: number | null
          type: string
          updated_at: string
          volume: number
          volume_24h: number | null
          volume_spike: number
          vwap: number | null
        }
        Insert: {
          amount: number
          anomaly_score?: number
          ask?: number | null
          asset: string
          bid?: number | null
          change_24h?: number
          close_price?: number | null
          created_at?: string
          daily_volume_impact?: number
          exchange?: string | null
          expires_at?: string
          high_price?: number | null
          id?: string
          is_hidden?: boolean
          is_micro_cap?: boolean
          last_activity_hours?: number
          low_price?: number | null
          open_price?: number | null
          price: number
          ticker: string
          trades_count?: number | null
          type: string
          updated_at?: string
          volume?: number
          volume_24h?: number | null
          volume_spike?: number
          vwap?: number | null
        }
        Update: {
          amount?: number
          anomaly_score?: number
          ask?: number | null
          asset?: string
          bid?: number | null
          change_24h?: number
          close_price?: number | null
          created_at?: string
          daily_volume_impact?: number
          exchange?: string | null
          expires_at?: string
          high_price?: number | null
          id?: string
          is_hidden?: boolean
          is_micro_cap?: boolean
          last_activity_hours?: number
          low_price?: number | null
          open_price?: number | null
          price?: number
          ticker?: string
          trades_count?: number | null
          type?: string
          updated_at?: string
          volume?: number
          volume_24h?: number | null
          volume_spike?: number
          vwap?: number | null
        }
        Relationships: []
      }
      liquidations: {
        Row: {
          amount: number
          ask: number | null
          asset: string
          bid: number | null
          change_24h: number
          close_price: number | null
          created_at: string
          exchange: string | null
          expires_at: string
          high_price: number | null
          id: string
          intensity: number
          low_price: number | null
          market_cap: string
          open_price: number | null
          price: number
          ticker: string
          total_liquidated: number
          trades_count: number | null
          type: string
          updated_at: string
          volume: number
          volume_spike: number | null
          vwap: number | null
        }
        Insert: {
          amount: number
          ask?: number | null
          asset: string
          bid?: number | null
          change_24h?: number
          close_price?: number | null
          created_at?: string
          exchange?: string | null
          expires_at?: string
          high_price?: number | null
          id?: string
          intensity?: number
          low_price?: number | null
          market_cap: string
          open_price?: number | null
          price: number
          ticker: string
          total_liquidated?: number
          trades_count?: number | null
          type: string
          updated_at?: string
          volume?: number
          volume_spike?: number | null
          vwap?: number | null
        }
        Update: {
          amount?: number
          ask?: number | null
          asset?: string
          bid?: number | null
          change_24h?: number
          close_price?: number | null
          created_at?: string
          exchange?: string | null
          expires_at?: string
          high_price?: number | null
          id?: string
          intensity?: number
          low_price?: number | null
          market_cap?: string
          open_price?: number | null
          price?: number
          ticker?: string
          total_liquidated?: number
          trades_count?: number | null
          type?: string
          updated_at?: string
          volume?: number
          volume_spike?: number | null
          vwap?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_asset_statistics: {
        Args: { asset_name: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
