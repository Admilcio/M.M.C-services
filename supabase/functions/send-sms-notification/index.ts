import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Twilio } from 'https://esm.sh/twilio@4.22.0'

const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Missing Twilio environment variables')
    }

    const { booking } = await req.json()
    if (!booking) {
      throw new Error('No booking data received')
    }

    const client = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

    // Format the message
    const message = `
New Booking:
Service: ${booking.service.name}
Date: ${booking.booking_date}
Time: ${booking.start_time} - ${booking.end_time}
Customer: ${booking.customer.full_name}
Phone: ${booking.customer.phone}
Address: ${booking.address}
ZIP: ${booking.zip_code}
${booking.notes ? `Notes: ${booking.notes}` : ''}`

    const result = await client.messages.create({
      body: message,
      to: booking.customer.phone,
      from: TWILIO_PHONE_NUMBER
    })

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending SMS:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send SMS',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})