/*
  # Fix SMS Notifications Setup

  1. Changes
    - Create storage table for configuration
    - Add notification trigger
    - Configure admin phone number
*/

-- Create storage table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'storage' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE storage ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Allow public to view storage" ON storage;
CREATE POLICY "Allow public to view storage"
  ON storage FOR SELECT
  TO public
  USING (true);

-- Insert or update admin phone
INSERT INTO storage (key, value)
VALUES ('admin_phone', '+351933659453')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Create function to handle notifications
CREATE OR REPLACE FUNCTION send_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_phone text;
BEGIN
  -- Get admin phone from storage
  SELECT value INTO admin_phone
  FROM storage
  WHERE key = 'admin_phone';

  IF admin_phone IS NULL THEN
    RAISE EXCEPTION 'Admin phone number not configured';
  END IF;

  -- Call Edge Function with proper error handling
  BEGIN
    PERFORM
      net.http_post(
        url := CASE 
          WHEN current_setting('request.headers', true)::json->>'host' IS NOT NULL 
          THEN 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification'
          ELSE NULL
        END,
        headers := jsonb_build_object('Content-Type', 'application/json'),
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
            'admin_phone', admin_phone
          )
        )::text
      );
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't block the booking
      RAISE WARNING 'Failed to send notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;

-- Create new trigger
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_notification();