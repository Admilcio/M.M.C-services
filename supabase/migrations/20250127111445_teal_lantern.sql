/*
  # Fix customer table setup and constraints

  1. Changes
    - Ensures customer table exists with proper structure
    - Adds unique constraint on email
    - Sets up proper foreign key relationships
    - Configures RLS policies

  2. Security
    - Enables RLS
    - Creates appropriate policies for public access
*/

-- Create customers table if it doesn't exist
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Drop existing foreign key constraints
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Add new foreign key constraints with cascade delete
ALTER TABLE bookings
ADD CONSTRAINT bookings_customer_id_fkey
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE CASCADE;

ALTER TABLE orders
ADD CONSTRAINT orders_customer_id_fkey
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
DROP POLICY IF EXISTS "Allow public to update customers" ON customers;

-- Create new policies
CREATE POLICY "Allow public to insert customers"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view customers"
  ON customers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to update customers"
  ON customers FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'customers_email_unique'
  ) THEN
    ALTER TABLE customers 
    ADD CONSTRAINT customers_email_unique UNIQUE (email);
  END IF;
END $$;