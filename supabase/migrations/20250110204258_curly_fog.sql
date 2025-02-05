/*
  # Update Bookings Table RLS Policies

  1. Security Changes
    - Allow public insertion of bookings
    - Allow public viewing of bookings
    - Remove existing restrictive policies
  
  Note: This migration enables public access for the booking system
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Customers can view and manage their bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public to insert bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public to view their bookings" ON bookings;

-- Create new policies
CREATE POLICY "Allow public to insert bookings"
    ON bookings FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Allow public to view their bookings"
    ON bookings FOR SELECT
    TO public
    USING (true);