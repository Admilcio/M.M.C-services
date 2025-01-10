/*
  # Initial Schema Setup for Marta.service

  1. New Tables
    - `services`
      - Stores available service types
      - Fields: id, name, description, price_per_hour, created_at
    
    - `bookings`
      - Stores customer booking information
      - Fields: id, customer_id, service_id, booking_date, start_time, end_time, status, notes, created_at
    
    - `customers`
      - Stores customer information
      - Fields: id, full_name, email, phone, created_at

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_per_hour decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  service_id uuid REFERENCES services(id),
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time >= '07:00' AND end_time <= '18:00')
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Customers can view and edit their own data"
  ON customers FOR ALL
  TO authenticated
  USING (auth.uid() = id);


CREATE POLICY "Customers can view and manage their bookings"
  ON bookings FOR ALL
  TO authenticated
  USING (customer_id = auth.uid());

-- Insert initial services
INSERT INTO services (name, description, price_per_hour)
VALUES 
  ('Cleaning', 'Professional home cleaning service', 30),
  ('Cooking', 'Personal chef and meal preparation', 40),
  ('Babysitting', 'Professional childcare service', 35),
  ('Decorating', 'Interior decoration and styling', 45);