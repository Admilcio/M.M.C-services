// Format phone number for WhatsApp
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Add country code if not present
  return digits.startsWith('351') ? digits : `351${digits}`;
}

// Create WhatsApp message link
export function createWhatsAppLink(message: string, phone: string = '351912137525'): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

// Format booking details for WhatsApp
export function formatBookingMessage(booking: {
  service: {
    name: string;
    price_per_hour: number;
  };
  booking_date: string;
  start_time: string;
  end_time: string;
  customer: {
    full_name: string;
    email: string;
    phone: string;
  };
  address: string;
  zip_code: string;
  notes?: string;
}): string {
  return `
*Nova Marcação de Serviço*

Serviço: ${booking.service.name}
Data: ${booking.booking_date}
Horário: ${booking.start_time} - ${booking.end_time}

Detalhes do Cliente:
- Nome: ${booking.customer.full_name}
- Email: ${booking.customer.email}
- Telefone: ${booking.customer.phone}

Morada: ${booking.address}
Código Postal: ${booking.zip_code}
${booking.notes ? `\nNotas: ${booking.notes}` : ''}

Preço por Hora: €${booking.service.price_per_hour}

Obrigado por escolher os nossos serviços! 🙏`;
}

// Format pastry order details for WhatsApp
export function formatPastryOrderMessage(order: {
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    zip_code: string;
  };
  special_instructions?: string;
}): string {
  const itemsList = order.items
    .map(item => `- ${item.name} (${item.quantity}x)`)
    .join('\n');

  return `
*Nova Encomenda de Pastelaria*

Itens:
${itemsList}

Total: Preço por determinar

Detalhes de Entrega:
- Nome: ${order.customer.name}
- Morada: ${order.customer.address}
- Código Postal: ${order.customer.zip_code}
- Telefone: ${order.customer.phone}
${order.special_instructions ? `\nInstruções Especiais: ${order.special_instructions}` : ''}

 Obrigado pela encomenda na M.M.C Pastelaria! Entraremos em contato em breve!`;
}
