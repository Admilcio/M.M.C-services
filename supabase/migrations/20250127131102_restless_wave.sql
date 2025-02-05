/*
  # Fix SMS Notifications

  1. Changes
    - Drop and recreate storage table with proper schema
    - Update notification trigger to properly handle admin phone
    - Add proper error handling
*/

-- Drop existing objects to ensure clean slate
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
DROP FUNCTION IF EXISTS send_booking_notification();
DROP TABLE IF EXISTS storage;

-- Create storage table
CREATE TABLE storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE storage ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow public to view storage"
  ON storage FOR SELECT
  TO public
  USING (true);

-- Insert admin phone
INSERT INTO storage (key, value)
VALUES ('admin_phone', '+351933659453');

-- Create notification function with improved error handling
CREATE OR REPLACE FUNCTION send_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_phone text;
  service_details jsonb;
  customer_details jsonb;
BEGIN
  -- Get admin phone from storage
  SELECT value INTO admin_phone
  FROM storage
  WHERE key = 'admin_phone';

  IF admin_phone IS NULL THEN
    RAISE WARNING 'Admin phone number not configured';
    RETURN NEW;
  END IF;

  -- Get customer details
  SELECT jsonb_build_object(
    'full_name', c.full_name,
    'email', c.email,
    'phone', c.phone
  ) INTO customer_details
  FROM customers c
  WHERE c.id = NEW.customer_id;

  -- Build notification payload
  BEGIN
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', current_setting('request.jwt.claim.role', true)
        ),
        body := jsonb_build_object(
          'booking', jsonb_build_object(
            'id', NEW.id,
            'service_name', NEW.service_name,
            'booking_date', NEW.booking_date,
            'start_time', NEW.start_time,
            'end_time', NEW.end_time,
            'address', NEW.address,
            'zip_code', NEW.zip_code,
            'notes', NEW.notes,
            'customer', customer_details,
            'admin_phone', admin_phone
          )
        )::text
      );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't block booking
      RAISE WARNING 'Failed to send notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_notification();