CREATE TYPE "public"."ad_platform" AS ENUM('google', 'meta', 'tiktok', 'bing', 'snapchat', 'amazon');--> statement-breakpoint
CREATE TYPE "public"."cost_alert_severity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."cost_alert_status" AS ENUM('active', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TYPE "public"."custom_cost_type" AS ENUM('per_order', 'percent_revenue', 'fixed_monthly');--> statement-breakpoint
CREATE TYPE "public"."email_log_status" AS ENUM('pending', 'matched', 'skipped', 'error');--> statement-breakpoint
CREATE TYPE "public"."email_provider" AS ENUM('gmail', 'outlook', 'imap');--> statement-breakpoint
CREATE TYPE "public"."shipping_source" AS ENUM('email', 'manual', 'fedex', 'csv');--> statement-breakpoint
CREATE TYPE "public"."store_status" AS ENUM('active', 'disconnected');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sync_type" AS ENUM('orders', 'products', 'ads', 'agent');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "ad_platform_connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"account_id" text,
	"account_name" text,
	"last_sync_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ad_spend_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"platform" "ad_platform" NOT NULL,
	"campaign_id" text,
	"campaign_name" text,
	"date" timestamp NOT NULL,
	"spend" numeric(12, 2) DEFAULT '0' NOT NULL,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"revenue_attributed" numeric(12, 2)
);
--> statement-breakpoint
CREATE TABLE "alert_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shipping_percent_threshold" numeric(5, 2) DEFAULT '20' NOT NULL,
	"shipping_dollar_threshold" numeric(12, 2) DEFAULT '10' NOT NULL,
	"cogs_percent_threshold" numeric(5, 2) DEFAULT '15' NOT NULL,
	"cogs_dollar_threshold" numeric(12, 2) DEFAULT '25' NOT NULL,
	"enable_in_app" boolean DEFAULT true NOT NULL,
	"enable_email" boolean DEFAULT false NOT NULL,
	"enable_sms" boolean DEFAULT false NOT NULL,
	"alert_email" text,
	"alert_phone" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alert_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "connected_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider" "email_provider" NOT NULL,
	"email_address" text NOT NULL,
	"label" text,
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"store_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"last_scanned_at" timestamp,
	"scan_keywords" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cost_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"store_id" uuid NOT NULL,
	"type" text NOT NULL,
	"severity" "cost_alert_severity" DEFAULT 'medium' NOT NULL,
	"status" "cost_alert_status" DEFAULT 'active' NOT NULL,
	"expected_cost" numeric(12, 2) NOT NULL,
	"actual_cost" numeric(12, 2) NOT NULL,
	"difference" numeric(12, 2) NOT NULL,
	"percent_over" numeric(8, 2) NOT NULL,
	"message" text NOT NULL,
	"notified_email" boolean DEFAULT false NOT NULL,
	"notified_sms" boolean DEFAULT false NOT NULL,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_cost_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "custom_cost_type" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"applies_to" text DEFAULT 'all' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"shopify_customer_id" text,
	"email" text,
	"name" text,
	"first_order_date" timestamp,
	"last_order_date" timestamp,
	"total_orders" integer DEFAULT 0 NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_cogs" numeric(12, 2) DEFAULT '0' NOT NULL,
	"ltv_net_profit" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"connected_email_id" uuid,
	"email_subject" text,
	"sender" text,
	"received_at" timestamp,
	"processed_at" timestamp,
	"status" "email_log_status" DEFAULT 'pending' NOT NULL,
	"extracted_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fedex_lookups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"tracking_number" text NOT NULL,
	"status" text,
	"estimated_cost" numeric(12, 2),
	"actual_billed" numeric(12, 2),
	"source" text,
	"looked_up_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexus_tracking" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"state" text NOT NULL,
	"total_revenue" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"revenue_threshold" numeric(12, 2) DEFAULT '100000' NOT NULL,
	"transaction_threshold" integer DEFAULT 200 NOT NULL,
	"has_nexus" boolean DEFAULT false NOT NULL,
	"registered_for_tax" boolean DEFAULT false NOT NULL,
	"taxjar_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"shopify_line_item_id" text NOT NULL,
	"product_id" text,
	"variant_id" text,
	"title" text NOT NULL,
	"sku" text,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(12, 2) DEFAULT '0' NOT NULL,
	"line_cogs" numeric(12, 2) DEFAULT '0' NOT NULL,
	"price" numeric(12, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"shopify_order_id" text NOT NULL,
	"order_number" text NOT NULL,
	"order_date" timestamp NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_tax" numeric(12, 2) DEFAULT '0' NOT NULL,
	"shipping_charged" numeric(12, 2) DEFAULT '0' NOT NULL,
	"actual_shipping_cost" numeric(12, 2),
	"transaction_fee" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_cogs" numeric(12, 2) DEFAULT '0' NOT NULL,
	"custom_costs_total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"net_profit" numeric(12, 2) DEFAULT '0' NOT NULL,
	"customer_email" text,
	"customer_name" text,
	"financial_status" text,
	"fulfillment_status" text,
	"tax_lines" jsonb,
	"shipping_province" text,
	"shipping_country" text,
	"raw_data" jsonb,
	"synced_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "shipping_cost_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"source" "shipping_source" NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"invoice_number" text,
	"supplier_name" text,
	"email_log_id" uuid,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shopify_domain" text NOT NULL,
	"shopify_access_token" text NOT NULL,
	"name" text NOT NULL,
	"status" "store_status" DEFAULT 'active' NOT NULL,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid,
	"type" "sync_type" NOT NULL,
	"status" "sync_status" DEFAULT 'running' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"orders_synced" integer DEFAULT 0,
	"errors" jsonb
);
--> statement-breakpoint
CREATE TABLE "tax_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"order_id" uuid,
	"state" text NOT NULL,
	"jurisdiction" text,
	"taxable_amount" numeric(12, 2) NOT NULL,
	"tax_collected" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(8, 6),
	"order_date" timestamp NOT NULL,
	"period" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"password_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_platform_connections" ADD CONSTRAINT "ad_platform_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ad_spend_daily" ADD CONSTRAINT "ad_spend_daily_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_settings" ADD CONSTRAINT "alert_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_emails" ADD CONSTRAINT "connected_emails_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_emails" ADD CONSTRAINT "connected_emails_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_alerts" ADD CONSTRAINT "cost_alerts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_alerts" ADD CONSTRAINT "cost_alerts_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_cost_rules" ADD CONSTRAINT "custom_cost_rules_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_connected_email_id_connected_emails_id_fk" FOREIGN KEY ("connected_email_id") REFERENCES "public"."connected_emails"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fedex_lookups" ADD CONSTRAINT "fedex_lookups_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nexus_tracking" ADD CONSTRAINT "nexus_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_cost_updates" ADD CONSTRAINT "shipping_cost_updates_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_cost_updates" ADD CONSTRAINT "shipping_cost_updates_email_log_id_email_logs_id_fk" FOREIGN KEY ("email_log_id") REFERENCES "public"."email_logs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stores" ADD CONSTRAINT "stores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_records" ADD CONSTRAINT "tax_records_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_spend_store_date_idx" ON "ad_spend_daily" USING btree ("store_id","date");--> statement-breakpoint
CREATE INDEX "ad_spend_platform_idx" ON "ad_spend_daily" USING btree ("store_id","platform");--> statement-breakpoint
CREATE INDEX "connected_emails_user_idx" ON "connected_emails" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cost_alerts_store_status_idx" ON "cost_alerts" USING btree ("store_id","status");--> statement-breakpoint
CREATE INDEX "customers_store_idx" ON "customers" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "customers_email_idx" ON "customers" USING btree ("store_id","email");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_store_shopify_idx" ON "orders" USING btree ("store_id","shopify_order_id");--> statement-breakpoint
CREATE INDEX "orders_store_date_idx" ON "orders" USING btree ("store_id","order_date");--> statement-breakpoint
CREATE INDEX "tax_records_state_idx" ON "tax_records" USING btree ("store_id","state","period");