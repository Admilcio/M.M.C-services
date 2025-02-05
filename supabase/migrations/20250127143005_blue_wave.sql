/*
  # Fix pastry orders schema

  1. New Tables
    - `pastry_orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `total` (numeric)
      - `status` (text)
      - `special_instructions` (text)
      - `address` (text)
      - `zip_code` (text)
      - `created_at` (timestamptz)

    - `pastry_order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references pastry_orders)
      - `name` (text)
      - `quantity` (integer)
      - `price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS pastry_order_items CASCADE;
DROP TABLE IF EXISTS pastry_orders CASCADE;

-- Create pastry_orders table
CREATE TABLE pastry_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending',
  special_instructions text,
  address text NOT NULL,
  zip_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create pastry_order_items table
CREATE TABLE pastry_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES pastry_orders(id) ON DELETE CASCADE,
  name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pastry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for pastry_orders
CREATE POLICY "Allow public to insert pastry orders"
  ON pastry_orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view pastry orders"
  ON pastry_orders FOR SELECT
  TO public
  USING (true);

-- Create policies for pastry_order_items
CREATE POLICY "Allow public to insert pastry order items"
  ON pastry_order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view pastry order items"
  ON pastry_order_items FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_pastry_orders_customer_id ON pastry_orders(customer_id);
CREATE INDEX idx_pastry_order_items_order_id ON pastry_order_items(order_id);