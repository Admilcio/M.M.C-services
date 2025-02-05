import { supabase } from './supabase';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;

export async function sendBookingNotification(bookingDetails: {
  booking_date: string;
  start_time: string;
  end_time: string;
  customer: {
    full_name: string;
    email: string;
    phone: string;
  };
  service: {
    name: string;
    price_per_hour: number;
  };
  notes?: string;
}) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MMC Services <onboarding@resend.dev>',
        to: import.meta.env.VITE_ADMIN_EMAIL,
        subject: 'New Booking Notification - MMC Services',
        html: `
          <h2>New Booking Details</h2>
          <p><strong>Service:</strong> ${bookingDetails.service.name}</p>
          <p><strong>Date:</strong> ${bookingDetails.booking_date}</p>
          <p><strong>Time:</strong> ${bookingDetails.start_time} - ${bookingDetails.end_time}</p>
          <p><strong>Customer Name:</strong> ${bookingDetails.customer.full_name}</p>
          <p><strong>Customer Email:</strong> ${bookingDetails.customer.email}</p>
          <p><strong>Customer Phone:</strong> ${bookingDetails.customer.phone}</p>
          ${bookingDetails.notes ? `<p><strong>Notes:</strong> ${bookingDetails.notes}</p>` : ''}
          <p><strong>Price per Hour:</strong> $${bookingDetails.service.price_per_hour}</p>
        `,
      }),
    });

    if (!response.ok) {
      console.error('Failed to send email:', await response.text());
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    console.log('Email sent successfully:', data);
    return data.id ? true : false;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}