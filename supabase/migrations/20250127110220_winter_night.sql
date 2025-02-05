/*
  # Modify foreign key constraint to enable cascade deletion
  
  1. Changes
    - Drops existing foreign key constraint
    - Recreates constraint with ON DELETE CASCADE
  
  2. Security
    - Maintains referential integrity
    - Enables automatic cleanup of related bookings
*/

-- Drop existing foreign key constraint
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey;

-- Add new foreign key constraint with cascade delete
ALTER TABLE bookings
ADD CONSTRAINT bookings_customer_id_fkey
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE CASCADE;