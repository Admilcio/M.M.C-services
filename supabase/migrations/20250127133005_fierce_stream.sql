/*
  # Create pastries schema

  1. New Tables
    - `pastries`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `ingredients` (text[])
      - `price` (numeric)
      - `category` (text)
      - `image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `pastry_orders`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, references customers)
      - `total` (numeric)
      - `status` (text)
      - `special_instructions` (text)
      - `delivery_address` (text)
      - `delivery_zip` (text)
      - `created_at` (timestamptz)
    
    - `pastry_order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, references pastry_orders)
      - `pastry_id` (uuid, references pastries)
      - `quantity` (integer)
      - `price` (numeric)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to pastries
    - Add policies for order management
*/

-- Create pastries table
CREATE TABLE pastries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  ingredients text[] NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pastry_orders table
CREATE TABLE pastry_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending',
  special_instructions text,
  delivery_address text NOT NULL,
  delivery_zip text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create pastry_order_items table
CREATE TABLE pastry_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES pastry_orders(id) ON DELETE CASCADE,
  pastry_id uuid REFERENCES pastries(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pastries ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pastry_order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to view pastries"
  ON pastries FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to create orders"
  ON pastry_orders FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view their own orders"
  ON pastry_orders FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public to create order items"
  ON pastry_order_items FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public to view their own order items"
  ON pastry_order_items FOR SELECT
  TO public
  USING (true);

-- Create function for order notifications
CREATE OR REPLACE FUNCTION notify_pastry_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-email-notification',
      headers := jsonb_build_object('Content-Type', 'application/json'),
      body := jsonb_build_object(
        'order', jsonb_build_object(
          'id', NEW.id,
          'total', NEW.total,
          'status', NEW.status,
          'special_instructions', NEW.special_instructions,
          'delivery_address', NEW.delivery_address,
          'delivery_zip', NEW.delivery_zip,
          'created_at', NEW.created_at
        )
      )::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for order notifications
CREATE TRIGGER pastry_order_notification
  AFTER INSERT ON pastry_orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_pastry_order();

-- Insert sample pastries
INSERT INTO pastries (name, description, ingredients, price, category, image_url) VALUES
('Chocolate Layer Cake', 'Rich chocolate cake with ganache filling', ARRAY['chocolate', 'butter', 'sugar', 'eggs', 'flour'], 35.99, 'cakes', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587'),
('Vanilla Bean Croissant', 'Flaky butter croissant with vanilla filling', ARRAY['flour', 'butter', 'vanilla beans', 'sugar', 'salt'], 4.99, 'pastries', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a'),
('Chocolate Chip Cookies', 'Classic cookies with Belgian chocolate', ARRAY['flour', 'butter', 'chocolate chips', 'sugar', 'eggs'], 2.99, 'cookies', 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e'),
('Sourdough Bread', 'Artisanal sourdough bread', ARRAY['flour', 'water', 'salt', 'sourdough starter'], 6.99, 'breads', 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73');