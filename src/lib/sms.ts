/* import { supabase } from './supabase';

const TWILIO_ACCOUNT_SID = import.meta.env.VITE_TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = import.meta.env.VITE_TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = import.meta.env.VITE_TWILIO_PHONE_NUMBER;
const ADMIN_PHONE = '+351912137525';

interface OrderNotification {
  orderDetails: {
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    total: number;
    customer: {
      name: string;
      email: string;
      phone: string;
      address: string;
      zip_code: string;
    };
    special_instructions?: string;
  };
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Only format if it's a valid Portuguese number
  if (!validatePhoneNumber(digits)) {
    throw new Error('Please enter a valid Portuguese mobile number (9 digits starting with 9)');
  }
  return `+351${digits}`;
}

function validatePhoneNumber(phone: string): boolean {
  // Basic validation for Portuguese phone numbers (9 digits)
  const digits = phone.replace(/\D/g, '');
  // Portuguese mobile numbers start with 9 and have 9 digits
  return /^9\d{8}$/.test(digits);
}
  // Format message
  const sanitizeText = (text: string) =>
    text.replace(/[\u2019]/g, "'").replace(/[\u2002]/g, " ");

async function sendSMS(to: string, body: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
      },
      body: new URLSearchParams({
        To: to,
        From: "MMCServices",
        Body: body
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    return { success: true, message: `SMS sent successfully (SID: ${data.sid})` };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

export async function sendSMSNotification(notification: OrderNotification): Promise<{ success: boolean; message: string }> {
  try {
    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Missing Twilio configuration');
    }

    // Format the message
    const adminMessage = sanitizeText(`
    Nova Encomenda de Pastelaria:
    
    Itens:
    ${notification.orderDetails.items
      .map(item => `- ${item.name} (${item.quantity}x)`)
      .join('\n')}
    Total: A confirmar!
    Cliente:
    Nome: ${notification.orderDetails.customer.name}
    Tel: ${notification.orderDetails.customer.phone}
    Morada: ${notification.orderDetails.customer.address}
    Cód. Postal: ${notification.orderDetails.customer.zip_code}
    ${notification.orderDetails.special_instructions 
      ? `\nNotas: ${notification.orderDetails.special_instructions.replace(/[^A-Za-z0-9., -]/g, '').slice(0, 50)}...` 
      : ''}`
    )
    
    const customerMessage = sanitizeText(`
    Obrigado pela encomenda na M.M.C Pastelaria! Entraremos em contato em breve!
    
    Detalhes da Encomenda:
    ${notification.orderDetails.items
      .map(item => `- ${item.name} (${item.quantity}x)`)
      .join('\n')}
    Total: A confirmar!
    Entrega:
    ${notification.orderDetails.customer.address}
    Cód. Postal: ${notification.orderDetails.customer.zip_code}
    Preparamos a sua encomenda agora!`
    );

    // Send SMS to admin
    const adminResult = await sendSMS(ADMIN_PHONE, adminMessage);
    if (!adminResult.success) {
      console.warn('Failed to send admin notification:', adminResult.message);
    }

    // Send SMS to customer
    const customerPhone = notification.orderDetails.customer.phone.replace(/\D/g, '');
    if (!validatePhoneNumber(customerPhone)) {
      throw new Error('Please enter a valid Portuguese mobile number (9 digits starting with 9)');
    }
    const formattedCustomerPhone = formatPhoneNumber(customerPhone);

    const customerResult = await sendSMS(formattedCustomerPhone, customerMessage);
    if (!customerResult.success) {
      console.warn('Failed to send customer notification:', customerResult.message);
    }

    return { 
      success: adminResult.success || customerResult.success,
      message: `Admin notification: ${adminResult.message}, Customer notification: ${customerResult.message}`
    };
  } catch (error) {
    console.error('Error sending SMS notification:', error instanceof Error ? error.message : error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send SMS notification' 
    };
  }
}
export async function sendBookingNotification(bookingDetails: {
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  zip_code: string;
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
}): Promise<{ success: boolean; message: string }> {
  try {
    // Validate required fields
    if (!bookingDetails.service?.name || !bookingDetails.booking_date || 
        !bookingDetails.customer?.full_name || !bookingDetails.customer?.phone ||
        !bookingDetails.address || !bookingDetails.zip_code) {
      const missing = [];
      if (!bookingDetails.service?.name) missing.push('service name');
      if (!bookingDetails.booking_date) missing.push('booking date');
      if (!bookingDetails.customer?.full_name) missing.push('customer name');
      if (!bookingDetails.customer?.phone) missing.push('phone number');
      if (!bookingDetails.address) missing.push('address');
      if (!bookingDetails.zip_code) missing.push('zip code');
      throw new Error(`Missing required booking details: ${missing.join(', ')}`);
    }

    // Validate phone number format
    const customerPhone = bookingDetails.customer.phone.replace(/\D/g, '');
    if (!validatePhoneNumber(customerPhone)) {
      throw new Error('Please enter a valid Portuguese mobile number (9 digits starting with 9)');
    }

    // Format the phone number
    const formattedPhone = formatPhoneNumber(customerPhone);

    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error('Missing Twilio configuration. Please check your environment variables.');
    }
  
  const adminMessage = sanitizeText(
    `Nova Marcacao: ${bookingDetails.service.name}, ${bookingDetails.booking_date} ${bookingDetails.start_time}-${bookingDetails.end_time}. Cliente: ${bookingDetails.customer.full_name}, Tel: ${bookingDetails.customer.phone}. ${bookingDetails.address}, ${bookingDetails.zip_code}${
      bookingDetails.notes ? `. Notas: ${bookingDetails.notes.replace(/[^A-Za-z0-9., -]/g, '').slice(0, 50)}...` : ''
    }`
    );
    // Format customer message
        const customerMessage = sanitizeText(`
    Obrigado por agendar com a M.M.C Services! Entraremos em contato brevemente!
    
    Confirmação de Agendamento:
    Serviço: ${bookingDetails.service.name}
    Data: ${bookingDetails.booking_date}
    Horário: ${bookingDetails.start_time} - ${bookingDetails.end_time}
    Morada: ${bookingDetails.address}
    Código Postal: ${bookingDetails.zip_code}`
    );

    // Send SMS to admin
    const adminResult = await sendSMS(ADMIN_PHONE, adminMessage);
    if (!adminResult.success) {
      console.warn('Failed to send admin notification:', adminResult.message);
    }

    // Send SMS to customer
    const formattedCustomerPhone = formatPhoneNumber(customerPhone);

    const customerResult = await sendSMS(formattedCustomerPhone, customerMessage);
    if (!customerResult.success) {
      console.warn('Failed to send customer notification:', customerResult.message);
    }

    return {
      success: adminResult.success || customerResult.success,
      message: `Admin notification: ${adminResult.message}, Customer notification: ${customerResult.message}`
    };
  } catch (error) {
    console.error('Error sending SMS notification:', error instanceof Error ? error.message : error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send SMS notification' 
    };
  }
}
 */
