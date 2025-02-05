/*
  # Add email notification trigger for bookings

  1. Changes
    - Creates a new function to handle booking notifications
    - Adds a trigger to call the function on new bookings
  
  2. Security
    - Function is set to SECURITY DEFINER to ensure it can always run
*/

-- Create the function that will call our Edge Function
CREATE OR REPLACE FUNCTION notify_booking_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Call the Edge Function
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('request.headers')::json->>'host' || '/functions/v1/send-booking-notification',
      body := json_build_object('record', row_to_json(NEW))::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER booking_created_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION notify_booking_created();