/*
  # Update admin phone number and SMS notifications

  1. Changes
    - Add admin_phone_number setting to public.storage
    - Update SMS notification function to use the stored admin phone number
*/

-- Create storage table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.storage (
  key text PRIMARY KEY,
  value text NOT NULL
);

-- Enable RLS
ALTER TABLE public.storage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public to view storage"
  ON public.storage FOR SELECT
  TO public
  USING (true);

-- Insert admin phone number
INSERT INTO public.storage (key, value)
VALUES ('admin_phone_number', '+351933659453')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value;

-- Update the SMS notification function
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
DECLARE
  admin_phone text;
BEGIN
  -- Get admin phone number from storage
  SELECT value INTO admin_phone
  FROM public.storage
  WHERE key = 'admin_phone_number';

  -- Call the Edge Function with the admin phone
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-sms-notification',
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;