/*
  # Fix orders schema and JSON handling

  1. Changes
    - Drop and recreate orders table with proper column types
    - Add proper constraints and defaults
    - Update RLS policies
    - Fix JSON handling in triggers

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Recreate orders table with proper schema
CREATE TABLE IF NOT EXISTS orders_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  address text NOT NULL,
  zip_code text NOT NULL
);

-- Copy data if old table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'orders') THEN
    INSERT INTO orders_new (
      id, customer_id, total, status, special_instructions, 
      created_at, address, zip_code
    )
    SELECT 
      id, customer_id, total, status, special_instructions, 
      created_at, address, zip_code
    FROM orders;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS orders CASCADE;
ALTER TABLE orders_new RENAME TO orders;

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view orders"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Create order items table with proper schema
CREATE TABLE IF NOT EXISTS order_items_new (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Copy data if old table exists
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'order_items') THEN
    INSERT INTO order_items_new (
      id, order_id, name, quantity, price, created_at
    )
    SELECT 
      id, order_id, name, quantity, price, created_at
    FROM order_items;
  END IF;
END $$;

-- Drop old table and rename new one
DROP TABLE IF EXISTS order_items CASCADE;
ALTER TABLE order_items_new RENAME TO order_items;

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to insert order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

-- Update notification function to handle JSON properly
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object('order', to_jsonb(NEW))::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
CREATE TRIGGER order_created_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();