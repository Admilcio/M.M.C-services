-- STEP 1: Update duplicate emails to make them unique
WITH duplicates AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) AS rn
  FROM customers
  WHERE email IN (
    SELECT email
    FROM customers
    GROUP BY email
    HAVING COUNT(*) > 1
  )
)
UPDATE customers
SET email = email || '_' || id
WHERE id IN (
  SELECT id
  FROM duplicates
  WHERE rn > 1
);

-- STEP 2: Add unique constraint to prevent future duplicates
DO $$ BEGIN
  ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);
EXCEPTION
  WHEN duplicate_table THEN RAISE NOTICE 'Constraint already exists.';
END $$;

-- STEP 3: Handle foreign key constraint violations (Option B - Cascade Updates and Deletions)

-- Drop the existing foreign key constraint
ALTER TABLE bookings
DROP CONSTRAINT bookings_customer_id_fkey;

-- Add a new foreign key constraint with ON DELETE CASCADE and ON UPDATE CASCADE
ALTER TABLE bookings
ADD CONSTRAINT bookings_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- STEP 4: Enable RLS for security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Allow public to insert customers" ON customers;
  DROP POLICY IF EXISTS "Allow public to view customers" ON customers;
END $$;

-- Create new policies
CREATE POLICY "Allow public to insert customers"
  ON customers FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view customers"
  ON customers FOR SELECT
  TO public
  USING (true);

-- STEP 5: Create trigger for notifications

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS customer_created_trigger ON customers;
DROP FUNCTION IF EXISTS notify_customer_created();

-- Create function for customer notifications
CREATE OR REPLACE FUNCTION notify_customer_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification',
      body := json_build_object('customer', row_to_json(NEW))::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for customer notifications
CREATE TRIGGER customer_created_trigger
  AFTER INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION notify_customer_created();
