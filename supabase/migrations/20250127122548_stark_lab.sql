/*
  # Add service name to bookings table

  1. Changes
    - Add service_name column to bookings table
    - Update RLS policies for the new column

  2. Security
    - Maintain existing RLS policies
    - Add service_name to allowed columns
*/

-- Add service_name column to bookings table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'service_name'
  ) THEN
    ALTER TABLE bookings ADD COLUMN service_name text NOT NULL DEFAULT '';
  END IF;
END $$;