/*
  # Switch to Email Notifications

  1. Changes
    - Update storage table to store admin email
    - Update notification trigger to send email instead of SMS
*/

-- Drop existing objects
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
DROP FUNCTION IF EXISTS send_booking_notification();

-- Update admin contact in storage
UPDATE storage 
SET value = 'admydamata@gmail.com'
WHERE key = 'admin_phone';

-- Rename key to reflect email usage
UPDATE storage 
SET key = 'admin_email'
WHERE key = 'admin_phone';

-- Create notification function with email support
CREATE OR REPLACE FUNCTION send_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  admin_email text;
  customer_details jsonb;
BEGIN
  -- Get admin email from storage
  SELECT value INTO admin_email
  FROM storage
  WHERE key = 'admin_email';

  IF admin_email IS NULL THEN
    RAISE WARNING 'Admin email not configured';
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

  -- Send email notification
  BEGIN
    PERFORM
      net.http_post(
        url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-email-notification',
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
            'admin_email', admin_email
          )
        )::text
      );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to send email notification: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION send_booking_notification();