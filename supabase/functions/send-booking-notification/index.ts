import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')

const resend = new Resend(RESEND_API_KEY)

serve(async (req) => {
  try {
    const { booking } = await req.json()

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      console.log('Missing email configuration')
      return new Response(
        JSON.stringify({ error: 'Missing email configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { data, error } = await resend.emails.send({
      from: 'MMC Services <notifications@resend.dev>',
      to: ADMIN_EMAIL,
      subject: 'New Booking Notification - MMC Services',
      html: `
        <h2>New Booking Details</h2>
        <p><strong>Service:</strong> ${booking.service.name}</p>
        <p><strong>Date:</strong> ${booking.date}</p>
        <p><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
        <p><strong>Customer Name:</strong> ${booking.customer.full_name}</p>
        <p><strong>Customer Email:</strong> ${booking.customer.email}</p>
        <p><strong>Customer Phone:</strong> ${booking.customer.phone}</p>
        ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
        <p><strong>Price per Hour:</strong> $${booking.service.price_per_hour}</p>
      `
    })

    if (error) {
      console.error('Resend API error:', error)
      throw error
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in edge function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})