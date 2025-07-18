-- Update existing payments table to add missing columns for enrollment tracking
-- Note: This assumes the payments table already exists from payment_schema_update.sql

-- Add missing columns to existing payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS sub_course_ids BIGINT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS enrollment_data JSONB;

-- Update payment_status to include new statuses
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_status_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_status_check 
  CHECK (payment_status IN ('pending', 'success', 'failed', 'cancelled', 'insufficient_amount', 'enrollment_failed'));

-- Create additional indexes for new columns
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(email);
CREATE INDEX IF NOT EXISTS idx_payments_sub_course_ids ON payments USING GIN(sub_course_ids);

-- RLS and policies should already exist from payment_schema_update.sql
-- This is just a reminder that the following policies should be in place:
-- "Users can view their own payments"
-- "Users can insert their own payments" 
-- "Users can update their own payments"
