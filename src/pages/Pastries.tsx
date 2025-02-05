import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cake, Clock, Mail, Phone, Heart, 
  CheckCircle, ArrowRight, ArrowLeft, 
  ShoppingCart, Search, Filter, Plus,
  Minus, Trash2 
} from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { createOrder } from '../lib/orders';

const BUSINESS_HOURS = {
  open: '7:00 AM',
  close: '6:00 PM'
};

interface PastryItem {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string;
}

interface CartItem extends PastryItem {
  quantity: number;
  price: number;
}

interface OrderDetails {
  order_details: {
    items: {
      name: string;
      quantity: number;
      price: number;
    }[];
    total: number;
  };
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    zip_code: string;
  };
  special_instructions?: string;
}

export function Pastries() {
  const [pastries, setPastries] = useState<PastryItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    zip_code: '',
  });
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'cakes', name: 'Cakes' },
    { id: 'pastries', name: 'Pastries' },
    { id: 'desserts', name: 'Desserts' },
    { id: 'sweets', name: 'Sweets' },
    { id: 'platters', name: 'Platters' },
  ];

  useEffect(() => {
    async function fetchPastries() {
      try {
        const { data, error } = await supabase
          .from('pastries')
          .select('*');

        if (error) {
          console.error('Error fetching pastries:', error);
          toast.error('Failed to load pastries');
          return;
        }

        if (data) {
          setPastries(data);
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('An error occurred while loading pastries');
      }
    }

    fetchPastries();
  }, []);

  const filteredPastries = pastries.filter(pastry => {
    const matchesSearch = pastry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pastry.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || pastry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (pastry: PastryItem) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === pastry.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.id === pastry.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...pastry, quantity: 1, price: 0 }];
    });
    toast.success(`Added ${pastry.name} to cart`);
  };

  const updateQuantity = (itemId: string, change: number) => {
    setCart(currentCart => {
      return currentCart.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + change);
          return newQuantity === 0 ? null : { ...item, quantity: newQuantity };
        }
        return item;
      }).filter((item): item is CartItem => item !== null);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(currentCart => currentCart.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const cartTotal = 0; // Price will be determined later

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    if (!customerDetails.name.trim() || !customerDetails.email.trim() || !customerDetails.phone.trim() || 
        !customerDetails.address || !customerDetails.zip_code) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { success, message } = await createOrder({
        customer: {
          name: customerDetails.name.trim(),
          email: customerDetails.email.trim(),
          phone: customerDetails.phone.trim(),
          address: customerDetails.address.trim(),
          zip_code: customerDetails.zip_code.trim()
        },
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: cartTotal,
        special_instructions: specialInstructions
      });

      if (!success) {
        throw new Error(message);
      }

      setOrderSuccess(true);
      setCart([]);
      setCustomerDetails({
        name: '',
        email: '',
        phone: '',
        address: '',
        zip_code: '',
      });
      setSpecialInstructions('');
      toast.success('Order placed successfully!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      toast.error(message);
      console.error('Order error:', message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8" />
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <img src="https://i.imgur.com/4kcohT7.jpeg" alt="M.M.C Logo" className="h-24 w-24 mx-auto mb-4 rounded-full object-cover" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">M.M.C Pastries</h1>
          <p className="text-xl text-gray-600">Delicious treats made with love</p>
            <p className="text-sm text-gray-600 font-semibold italic">
            (Book at least <span className="text-rose-500">48 hours</span> in advance.)
          </p>
        </div>

        {!showCart ? (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 space-y-4 sm:space-y-0">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search pastries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-rose-500 focus:border-rose-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center space-x-4">
                <Filter className="h-5 w-5 text-gray-500" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-300 rounded-lg py-2 px-4 focus:ring-rose-500 focus:border-rose-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setShowCart(true)}
                  className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Cart
                  {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-rose-200 text-rose-600 flex items-center justify-center text-xs font-bold">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPastries.map((pastry) => (
                <div
                  key={pastry.id}
                  className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="h-48 overflow-hidden">
                    <img
                      src={pastry.image_url}
                      alt={pastry.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900">{pastry.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{pastry.description}</p>
                    <div className="mt-4 flex items-center justify-center">
                      <div className="flex items-center text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-md">
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        <button
                          onClick={() => addToCart(pastry)}
                          className="text-rose-600 hover:text-rose-700 font-medium"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : orderSuccess ? (
          <div className="text-center py-12">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">Order Successful!</h3>
            <p className="mt-2 text-gray-600">
              Thank you for your order. We'll start preparing it right away!
            </p>
            <div className="mt-8">
              <button
                onClick={() => {
                  setShowCart(false);
                  setOrderSuccess(false);
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-rose-600 hover:bg-rose-700"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-rose-600 hover:text-rose-700"
              >
                Continue Shopping
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">Your cart is empty</h3>
                <p className="mt-2 text-gray-500">Add some delicious treats to get started!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
                      <div className="flex items-center space-x-4">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-16 w-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                          <p className="text-gray-500">Price to be determined</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Minus className="h-4 w-4 text-gray-500" />
                          </button>
                          <span className="text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <Plus className="h-4 w-4 text-gray-500" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-rose-600 hover:text-rose-700"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
                    <form onSubmit={handleCheckout} className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={customerDetails.name}
                          onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={customerDetails.email}
                          onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={customerDetails.phone}
                          onChange={(e) => {
                            // Only allow digits
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 9) {
                              setCustomerDetails(prev => ({ ...prev, phone: value }));
                            }
                          }}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          placeholder="9XXXXXXXX"
                          pattern="9\d{8}"
                          title="Please enter a valid Portuguese mobile number (9 digits starting with 9)"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                          Delivery Address
                        </label>
                        <input
                          type="text"
                          id="address"
                          value={customerDetails.address}
                          onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          id="zipCode"
                          value={customerDetails.zip_code}
                          onChange={(e) => setCustomerDetails(prev => ({ ...prev, zip_code: e.target.value }))}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">
                          Special Instructions
                        </label>
                        <textarea
                          id="specialInstructions"
                          value={specialInstructions}
                          onChange={(e) => setSpecialInstructions(e.target.value)}
                          rows={3}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-rose-500 focus:border-rose-500"
                          placeholder="Any special requests or delivery instructions..."
                        />
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex justify-between text-lg font-medium">
                          <span>Total</span>
                          <span>Price to be determined</span>
                        </div>
                        <button
                          type="submit"
                          className="mt-4 w-full bg-rose-600 text-white py-3 px-4 rounded-md hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                        >
                          Place Order
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}