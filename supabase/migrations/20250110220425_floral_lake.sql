/*
  # Update database schema and policies

  1. Schema Updates
    - Modify services table to use numeric(10,2) for price
    - Ensure proper types for all columns
  
  2. Policy Updates
    - Update policies to allow public access for bookings system
    - Handle existing policies safely
*/

-- Drop existing policies safely
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
    DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
    DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
    DROP POLICY IF EXISTS "Allow public to insert bookings" ON bookings;
    DROP POLICY IF EXISTS "Allow public to view bookings" ON bookings;
END $$;

-- Update price_per_hour type if needed
DO $$ 
BEGIN
    ALTER TABLE services 
    ALTER COLUMN price_per_hour TYPE numeric(10,2);
EXCEPTION
    WHEN undefined_column THEN
        NULL;
END $$;

-- Create new policies
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert customers"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view customers"
  ON customers FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to insert bookings"
  ON bookings FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view bookings"
  ON bookings FOR SELECT
  TO public
  USING (true);

-- Update service prices to use proper decimal values
UPDATE services 
SET price_per_hour = ROUND(price_per_hour::numeric, 2)
WHERE price_per_hour IS NOT NULL;