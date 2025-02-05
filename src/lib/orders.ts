import { supabase } from './supabase';
import { sendSMSNotification } from './sms';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderDetails {
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    zip_code: string;
  };
  items: OrderItem[];
  total: number;
  special_instructions?: string;
}

export async function createOrder(orderDetails: OrderDetails): Promise<{ success: boolean; message: string }> {
  try {
    // Input validation
    if (!orderDetails.customer || !orderDetails.items || orderDetails.items.length === 0) {
      throw new Error('Please provide all required order details');
    }

    // Step 1: Create or update customer
    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select()
      .eq('email', orderDetails.customer.email)
      .single();

    let customerData;
    
    if (existingCustomer) {
      // Update existing customer
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({
          full_name: orderDetails.customer.name,
          phone: orderDetails.customer.phone
        })
        .eq('id', existingCustomer.id)
        .select()
        .single();

      if (updateError) throw new Error('Failed to update customer information');
      customerData = updatedCustomer;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert([{
          full_name: orderDetails.customer.name,
          email: orderDetails.customer.email,
          phone: orderDetails.customer.phone
        }])
        .select()
        .single();

      if (createError) {
        throw new Error('Failed to create customer');
      }
      customerData = newCustomer;
    }

    if (!customerData?.id) {
      throw new Error('Failed to process customer data');
    }

    // Step 2: Create order
    const { data: pastryOrder, error: orderError } = await supabase
      .from('pastry_orders')
      .insert([{
        customer_id: customerData.id,
        total: orderDetails.total,
        special_instructions: orderDetails.special_instructions,
        address: orderDetails.customer.address,
        zip_code: orderDetails.customer.zip_code,
        status: 'pending'
      }])
      .select()
      .single();

    if (orderError || !pastryOrder) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    // Step 3: Create order items
    const orderItems = orderDetails.items.map(item => ({
      order_id: pastryOrder.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase
      .from('pastry_order_items')
      .insert(orderItems);

    if (itemsError) {
      throw new Error('Failed to create order items');
    }
    
    // Send SMS notification
    try {
      const notificationResult = await sendSMSNotification({
        orderDetails: {
          items: orderDetails.items,
          total: orderDetails.total,
          customer: orderDetails.customer,
          special_instructions: orderDetails.special_instructions
        }
      });
      
      if (!notificationResult.success) {
        console.warn('SMS notification warning:', notificationResult.message);
      }
    } catch (error) {
      console.warn('SMS notification warning:', error);
    }

    return { success: true, message: 'Order created successfully' };
  } catch (error: any) {
    console.error('Order Processing Error:', error.message);
    return { success: false, message: error.message || 'An unknown error occurred' };
  }
}