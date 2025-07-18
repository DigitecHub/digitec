-- Add payment fields to sub_courses table
ALTER TABLE sub_courses 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN currency VARCHAR(3) DEFAULT 'NGN',
ADD COLUMN is_free BOOLEAN DEFAULT true,
ADD COLUMN payment_required BOOLEAN DEFAULT false;

-- Create payments table to track payment transactions
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_course_id UUID REFERENCES sub_courses(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  paystack_transaction_id VARCHAR(255),
  payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'success', 'failed', 'cancelled')) DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_date TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments table
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_sub_course_id ON payments(sub_course_id);
CREATE INDEX idx_payments_reference ON payments(paystack_reference);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Update sub_course_enrollments to include payment reference
ALTER TABLE sub_course_enrollments 
ADD COLUMN payment_id UUID REFERENCES payments(id),
ADD COLUMN payment_status VARCHAR(50) CHECK (payment_status IN ('pending', 'paid', 'free')) DEFAULT 'free';

-- Add payment policies
CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);

-- Update existing sub_courses with sample pricing
UPDATE sub_courses SET 
  price = CASE 
    WHEN title LIKE '%Microsoft%' THEN 15000.00
    WHEN title LIKE '%Adobe%' OR title LIKE '%Photoshop%' OR title LIKE '%Illustrator%' THEN 25000.00
    WHEN title LIKE '%HTML%' OR title LIKE '%CSS%' OR title LIKE '%JavaScript%' THEN 20000.00
    WHEN title LIKE '%Node.js%' OR title LIKE '%Database%' OR title LIKE '%API%' THEN 30000.00
    WHEN title LIKE '%Forex%' OR title LIKE '%Trading%' THEN 35000.00
    WHEN title LIKE '%Excel%' OR title LIKE '%Python%' OR title LIKE '%SQL%' THEN 22000.00
    WHEN title LIKE '%UI%' OR title LIKE '%UX%' OR title LIKE '%Figma%' THEN 28000.00
    ELSE 18000.00
  END,
  is_free = false,
  payment_required = true
WHERE title IS NOT NULL;

-- Keep some courses free (you can adjust this as needed)
UPDATE sub_courses SET 
  price = 0.00,
  is_free = true,
  payment_required = false
WHERE title IN ('HTML Fundamentals', 'Microsoft Word Basics');

-- Create trigger to update payments updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
