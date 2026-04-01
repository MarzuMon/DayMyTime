export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          category_breakdown: Json
          completed_schedules: number
          created_at: string
          focus_minutes: number
          id: string
          pending_schedules: number
          productivity_score: number
          report_date: string
          streak_days: number
          total_schedules: number
          user_id: string
        }
        Insert: {
          category_breakdown?: Json
          completed_schedules?: number
          created_at?: string
          focus_minutes?: number
          id?: string
          pending_schedules?: number
          productivity_score?: number
          report_date: string
          streak_days?: number
          total_schedules?: number
          user_id: string
        }
        Update: {
          category_breakdown?: Json
          completed_schedules?: number
          created_at?: string
          focus_minutes?: number
          id?: string
          pending_schedules?: number
          productivity_score?: number
          report_date?: string
          streak_days?: number
          total_schedules?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_tips: {
        Row: {
          author_name: string
          content: string
          created_at: string
          created_by: string | null
          excerpt: string
          featured_image: string | null
          featured_image_2: string | null
          id: string
          image_align: string
          keywords: string | null
          likes_count: number
          meta_description: string | null
          publish_date: string
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_2?: string | null
          id?: string
          image_align?: string
          keywords?: string | null
          likes_count?: number
          meta_description?: string | null
          publish_date?: string
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_2?: string | null
          id?: string
          image_align?: string
          keywords?: string | null
          likes_count?: number
          meta_description?: string | null
          publish_date?: string
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      giveaway_config: {
        Row: {
          active_image_url: string | null
          expiry_date: string | null
          id: string
          is_finished: boolean
          start_count: number
          updated_at: string
        }
        Insert: {
          active_image_url?: string | null
          expiry_date?: string | null
          id?: string
          is_finished?: boolean
          start_count?: number
          updated_at?: string
        }
        Update: {
          active_image_url?: string | null
          expiry_date?: string | null
          id?: string
          is_finished?: boolean
          start_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      giveaway_contributions: {
        Row: {
          created_at: string
          email: string
          id: string
          image_url: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          image_url: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          image_url?: string
          phone?: string
        }
        Relationships: []
      }
      giveaway_winners: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name: string
          video_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          video_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          video_url?: string | null
        }
        Relationships: []
      }
      history_posts: {
        Row: {
          author_name: string
          content: string
          created_at: string
          created_by: string | null
          excerpt: string
          featured_image: string | null
          featured_image_2: string | null
          id: string
          image_align: string
          keywords: string | null
          likes_count: number
          meta_description: string | null
          publish_date: string
          seo_title: string | null
          slug: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_2?: string | null
          id?: string
          image_align?: string
          keywords?: string | null
          likes_count?: number
          meta_description?: string | null
          publish_date?: string
          seo_title?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          created_at?: string
          created_by?: string | null
          excerpt?: string
          featured_image?: string | null
          featured_image_2?: string | null
          id?: string
          image_align?: string
          keywords?: string | null
          likes_count?: number
          meta_description?: string | null
          publish_date?: string
          seo_title?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_followers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          page_path: string
          post_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          page_path: string
          post_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          page_path?: string
          post_id?: string | null
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          post_type: string
          user_id: string
          user_name: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          post_type: string
          user_id: string
          user_name?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          post_type?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          post_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          post_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          post_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          custom_tones: Json | null
          default_alarm_tone: string
          display_name: string
          id: string
          is_pro: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          custom_tones?: Json | null
          default_alarm_tone?: string
          display_name?: string
          id: string
          is_pro?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          custom_tones?: Json | null
          default_alarm_tone?: string
          display_name?: string
          id?: string
          is_pro?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_finished: boolean
          reward_days: number
          target_signups: number
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_finished?: boolean
          reward_days?: number
          target_signups?: number
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_finished?: boolean
          reward_days?: number
          target_signups?: number
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_signups: {
        Row: {
          created_at: string
          id: string
          referral_code_id: string
          referred_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code_id: string
          referred_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code_id?: string
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_signups_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_completions: {
        Row: {
          completion_date: string
          created_at: string
          id: string
          is_completed: boolean
          schedule_id: string
          user_id: string
        }
        Insert: {
          completion_date: string
          created_at?: string
          id?: string
          is_completed?: boolean
          schedule_id: string
          user_id: string
        }
        Update: {
          completion_date?: string
          created_at?: string
          id?: string
          is_completed?: boolean
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_completions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          alarm_tone: string
          category: string
          created_at: string
          description: string
          duration: number
          id: string
          image_path: string | null
          is_completed: boolean
          meeting_link: string | null
          meeting_platform: string | null
          repeat_days: Json | null
          repeat_type: string
          scheduled_time: string
          team_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          alarm_tone?: string
          category?: string
          created_at?: string
          description?: string
          duration?: number
          id?: string
          image_path?: string | null
          is_completed?: boolean
          meeting_link?: string | null
          meeting_platform?: string | null
          repeat_days?: Json | null
          repeat_type?: string
          scheduled_time: string
          team_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          alarm_tone?: string
          category?: string
          created_at?: string
          description?: string
          duration?: number
          id?: string
          image_path?: string | null
          is_completed?: boolean
          meeting_link?: string | null
          meeting_platform?: string | null
          repeat_days?: Json | null
          repeat_type?: string
          scheduled_time?: string
          team_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_keywords: {
        Row: {
          created_at: string
          id: string
          keyword: string
        }
        Insert: {
          created_at?: string
          id?: string
          keyword: string
        }
        Update: {
          created_at?: string
          id?: string
          keyword?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          expires_at: string
          id: string
          plan: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_subscription_id: string | null
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at: string
          id?: string
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          plan?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_subscription_id?: string | null
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          team_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          status?: string
          team_id: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          status?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          brand_color: string | null
          created_at: string
          description: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          description?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_subscription_expiry: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_auth_email: { Args: never; Returns: string }
      get_giveaway_count: { Args: never; Returns: number }
      get_invitation_by_token: {
        Args: { invite_token: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          status: string
          team_id: string
          token: string
        }[]
        SetofOptions: {
          from: "*"
          to: "team_invitations"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_owner: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
