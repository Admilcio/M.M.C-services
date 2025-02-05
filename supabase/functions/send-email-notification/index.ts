import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

if (!RESEND_API_KEY) {
  throw new Error('Missing required Resend API key')
}

const resend = new Resend(RESEND_API_KEY)

serve(async (req) => {
  try {
    console.log('Received request:', req.method, req.url)

    const body = await req.json()
    console.log('Request body:', JSON.stringify(body, null, 2))

    const { booking } = body

    if (!booking) {
      throw new Error('No booking data received')
    }

    // Get admin email
    const adminEmail = booking.admin_email
    if (!adminEmail) {
      throw new Error('Admin email not provided')
    }

    // Validate booking data
    if (!booking.service_name || !booking.booking_date || !booking.start_time || 
        !booking.end_time || !booking.address || !booking.zip_code) {
      throw new Error('Missing required booking details')
    }

    // Format the email content
    const htmlContent = `
      <h2>New Booking Details</h2>
      <p><strong>Service:</strong> ${booking.service_name}</p>
      <p><strong>Date:</strong> ${booking.booking_date}</p>
      <p><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
      <p><strong>Address:</strong> ${booking.address}</p>
      <p><strong>ZIP Code:</strong> ${booking.zip_code}</p>
      ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${booking.customer.full_name}</p>
      <p><strong>Email:</strong> ${booking.customer.email}</p>
      <p><strong>Phone:</strong> ${booking.customer.phone}</p>
    `

    try {
      console.log('Sending email notification to admin:', adminEmail)

      const result = await resend.emails.send({
        from: 'MMC Services <notifications@resend.dev>',
        to: adminEmail,
        subject: 'New Booking Notification - MMC Services',
        html: htmlContent
      })

      console.log('Email sent successfully:', result.id)

      return new Response(
        JSON.stringify({ success: true, messageId: result.id }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    } catch (emailError) {
      console.error('Resend API Error:', emailError)
      throw new Error('Failed to send email via Resend')
    }
  } catch (error) {
    console.error('Error sending email:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to send email notification',
        code: error instanceof Error ? error.name : 'UnknownError',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})