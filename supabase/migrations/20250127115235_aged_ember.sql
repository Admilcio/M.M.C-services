/*
  # Fix JSON handling and schema issues

  1. Schema Updates
    - Add proper JSON handling for orders table
    - Update foreign key constraints
    - Fix type casting issues

  2. Security
    - Update RLS policies for proper access
*/

-- Drop existing tables to recreate with proper schema
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create orders table with proper JSON handling
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending',
  special_instructions text,
  created_at timestamptz DEFAULT now(),
  address text NOT NULL,
  zip_code text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create order items table
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for orders
CREATE POLICY "Allow public to insert orders"
  ON orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view orders"
  ON orders FOR SELECT
  TO public
  USING (true);

-- Create policies for order items
CREATE POLICY "Allow public to insert order items"
  ON order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view order items"
  ON order_items FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Update notification function to handle JSON properly
CREATE OR REPLACE FUNCTION notify_order_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'order', jsonb_build_object(
          'id', NEW.id,
          'customer_id', NEW.customer_id,
          'total', NEW.total,
          'status', NEW.status,
          'special_instructions', NEW.special_instructions,
          'address', NEW.address,
          'zip_code', NEW.zip_code,
          'created_at', NEW.created_at
        )
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order notifications
DROP TRIGGER IF EXISTS order_created_trigger ON orders;
CREATE TRIGGER order_created_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_created();