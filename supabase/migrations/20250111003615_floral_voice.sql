/*
  # Add address fields to bookings table

  1. Changes
    - Add `address` column to bookings table
    - Add `zip_code` column to bookings table
    
  2. Notes
    - Both fields are required for service delivery
    - No data migration needed as these are new columns
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'address'
  ) THEN
    ALTER TABLE bookings ADD COLUMN address text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE bookings ADD COLUMN zip_code text NOT NULL DEFAULT '';
  END IF;
END $$;