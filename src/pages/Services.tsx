import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Mail, Phone, Star, Heart, CheckCircle, ArrowRight, ArrowLeft, MapPin, Cake } from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { ClockComponent } from '../components/ClockComponent';
import { sendBookingNotification } from '../lib/sms';

interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
}

interface BookingDetails {
  customer_id?: string;
  service_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  address: string;
  zip_code: string;
  notes?: string;
  service?: Service;
  customer?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

// Add fixed price services list
const FIXED_PRICE_SERVICES = ['House Cleaning', 'Cooking', 'Decorating'];

const isFixedPriceService = (serviceName: string) => {
  return FIXED_PRICE_SERVICES.includes(serviceName);
};

const convertTimeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isTimeWithinBusinessHours = (time: string): boolean => {
  const minutes = convertTimeToMinutes(time);
  const openingTimeMinutes = 7 * 60; // 7:00 AM
  const closingTimeMinutes = 18 * 60; // 6:00 PM
  return minutes >= openingTimeMinutes && minutes <= closingTimeMinutes;
};

export function Services() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [notes, setNotes] = useState('');
  const [services, setServices] = useState<Service[]>([]);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const servicesPerPage = 4;

  const serviceImages: { [key: string]: string } = {
    'House Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1000',
    'Office Cleaning': 'https://images.unsplash.com/photo-1596238597241-6e10f6bf085b?auto=format&fit=crop&q=80&w=1000',
    'Residential Cleaning': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000',
    'Condominium Cleaning': 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000',
    'Cooking': 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1000',
    'Babysitting': 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=1024',
    'Decorating': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1000',
  };

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase.from('services').select('*');
      
      if (error) {
        toast.error('Error fetching services');
        return;
      }

      if (data) {
        setServices(data);
      }
    }

    fetchServices();
  }, []);

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (!isTimeWithinBusinessHours(value)) {
      toast.error('Please select a time between 7:00 AM and 6:00 PM');
      return;
    }

    if (type === 'start') {
      setStartTime(value);
      if (endTime && convertTimeToMinutes(value) >= convertTimeToMinutes(endTime)) {
        setEndTime('');
      }
    } else {
      if (startTime && convertTimeToMinutes(value) <= convertTimeToMinutes(startTime)) {
        toast.error('End time must be after start time');
        return;
      }
      setEndTime(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // First validate all required fields
    if (!selectedService || !date || !startTime || !endTime || 
        !name || !email || !phone || !address || !zipCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Get the selected service details
    const selectedServiceDetails = services.find(s => s.id === selectedService);
    if (!selectedServiceDetails) {
      toast.error('Please select a valid service');
      return;
    }

    const startTimeMinutes = convertTimeToMinutes(startTime);
    const endTimeMinutes = convertTimeToMinutes(endTime);
    const openingTimeMinutes = 7 * 60;
    const closingTimeMinutes = 18 * 60;

    if (startTimeMinutes < openingTimeMinutes || endTimeMinutes > closingTimeMinutes) {
      toast.error('Booking times must be between 7:00 AM and 6:00 PM');
      return;
    }

    if (endTimeMinutes <= startTimeMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      // First check if customer exists
      let { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select()
        .eq('email', email)
        .single();

      let customerData;
      
      if (existingCustomer) {
        // Update existing customer
        const { data: updatedCustomer, error: updateError } = await supabase
          .from('customers')
          .update({
            full_name: name,
            phone: phone
          })
          .eq('id', existingCustomer.id)
          .select()
          .single();

        if (updateError) throw new Error('Failed to update customer information');
        customerData = updatedCustomer;
      } else {
        // Create new customer
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert([{ full_name: name, email, phone }])
          .select()
          .single();

        if (insertError) throw new Error('Failed to create customer');
        customerData = newCustomer;
      }

      if (!customerData) {
        throw new Error('Failed to process customer data');
      }


      const bookingData = {
        customer_id: customerData.id,
        service_name: selectedServiceDetails.name,
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        address,
        zip_code: zipCode,
        notes
      };

      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([bookingData]);

      if (bookingError) {
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }

      // Send SMS notification
      const notificationResult = await sendBookingNotification({
        booking_date: date,
        start_time: startTime,
        end_time: endTime,
        address,
        zip_code: zipCode,
        customer: {
          full_name: name,
          email,
          phone
        },
        service: {
          name: selectedServiceDetails.name,
          price_per_hour: selectedServiceDetails.price_per_hour
        },
        notes: notes || undefined
      });
      
      if (!notificationResult.success) {
        console.error('Failed to send SMS notification:', notificationResult.message);
        toast.error('Booking successful but failed to send SMS notification');
      } else {
        toast.success('Booking submitted successfully! SMS notification sent.');
      }
      setBookingDetails({
        ...bookingData,
        service: selectedServiceDetails,
        customer: { full_name: name, email, phone }
      });
      setBookingSuccess(true);

      setBookingDetails({
        ...bookingData,
        service: selectedServiceDetails,
        customer: { full_name: name, email, phone }
      });
      setBookingSuccess(true);
      toast.success('Booking submitted successfully!');
      
      // Reset form
      setSelectedService('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setZipCode('');
      setNotes('');
      setActiveStep(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred while processing your booking';
      toast.error(message);
    }
  };

  const paginate = (pageNumber: number, e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleServiceSelection = (serviceId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setSelectedService(serviceId);
    
    // Validate service selection immediately
    const service = services.find(s => s.id === serviceId);
    if (!service) {
      toast.error('Invalid service selection');
      return;
    }
  };

  const handleStepChange = (step: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setActiveStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPricing = (service: Service) => {
    if (isFixedPriceService(service.name)) {
      return (
        <p className="mt-2 text-lg font-semibold text-indigo-600 bg-indigo-50 p-2 rounded-md">
          €{service.price_per_hour}/hora
        </p>
      );
    }
    return (
      <div className="mt-2">
        <p className="text-sm text-gray-500 mt-1 font-bold italic bg-gray-50 p-2 rounded-md">
          Price varies based on service requirements
        </p>
      </div>
    );
  };

  // Pagination calculations
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = services.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(services.length / servicesPerPage);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Professional Home Services</h1>
          <p className="text-xl text-gray-600">Your trusted partner for all home service needs</p>
          <p className="text-sm text-gray-600 font-semibold italic">
            (Book at least <span className="text-rose-500">48 hours</span> in advance.)
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
            <div className="px-4 py-5 bg-gray-50 sm:px-6">
              <div className="flex justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      activeStep >= step ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                    }`}>
                      {activeStep > step ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <span>{step}</span>
                      )}
                    </div>
                    <div className={`ml-2 text-sm ${
                      activeStep >= step ? 'text-indigo-600 font-medium' : 'text-gray-500'
                    }`}>
                      {step === 1 ? 'Select Service' : step === 2 ? 'Choose Time' : 'Your Details'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Book a Service</h2>

              {!bookingSuccess ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-8">
                    <div className={`space-y-6 ${activeStep !== 1 && 'hidden'}`}>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {currentServices.map((service) => (
                          <div
                            key={service.id}
                            onClick={(e) => handleServiceSelection(service.id, e)}
                            className={`relative rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
                              selectedService === service.id && services.find(s => s.id === service.id)
                                ? 'border-indigo-500 ring-2 ring-indigo-500'
                                : 'border-gray-200 hover:border-indigo-300'
                            }`}
                            role="button"
                            tabIndex={0}
                          >
                            <div className="h-48 overflow-hidden">
                              <img
                                src={serviceImages[service.name] || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1000'}
                                alt={service.name}
                                className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                              />
                            </div>
                            <div className="p-4">
                              <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                              <p className="mt-1 text-sm text-gray-500">{service.description}</p>
                              {renderPricing(service)}
                              {!isFixedPriceService(service.name) && (
                                <div className="mt-2 flex items-center text-sm text-indigo-600 bg-indigo-50 p-2 rounded-md">
                                  <Phone className="w-4 h-4 mr-1" />
                                  <span>Contact for details</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex justify-center space-x-2 mt-6">
                          <button
                            type="button"
                            onClick={(e) => paginate(currentPage - 1, e)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Previous
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                            <button
                              type="button"
                              key={number}
                              onClick={(e) => paginate(number, e)}
                              className={`px-4 py-2 border rounded-md text-sm font-medium ${
                                currentPage === number
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                              }`}
                            >
                              {number}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={(e) => paginate(currentPage + 1, e)}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Next
                          </button>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleStepChange(2, e)}
                          disabled={!selectedService}
                          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        >
                          Next Step
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className={`space-y-6 ${activeStep !== 2 && 'hidden'}`}>
                      <div className="bg-white rounded-lg p-6 space-y-6">
                        <div>
                          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                            Select Date
                          </label>
                          <div className="mt-1">
                            <input
                              type="date"
                              id="date"
                              value={date}
                              onChange={(e) => setDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                              Start Time
                            </label>
                            <div className="mt-1">
                              <input
                                type="time"
                                id="startTime"
                                value={startTime}
                                onChange={(e) => handleTimeChange('start', e.target.value)}
                                min="07:00"
                                max="18:00"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                              End Time
                            </label>
                            <div className="mt-1">
                              <input
                                type="time"
                                id="endTime"
                                value={endTime}
                                onChange={(e) => handleTimeChange('end', e.target.value)}
                                min="07:00"
                                max="18:00"
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={(e) => handleStepChange(1, e)}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleStepChange(3, e)}
                            disabled={!date || !startTime || !endTime}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Next Step
                            <ArrowRight className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`space-y-6 ${activeStep !== 3 && 'hidden'}`}>
                      <div className="bg-white rounded-lg p-6 space-y-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Full Name
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="John Doe"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email Address
                          </label>
                          <div className="mt-1">
                            <input
                              type="email"
                              id="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="john@example.com"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone Number
                          </label>
                          <div className="mt-1">
                            <input
                              type="tel"
                              id="phone"
                              value={phone}
                              onChange={(e) => {
                                // Only allow digits
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 9) {
                                  setPhone(value);
                                }
                              }}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="9XXXXXXXX"
                              pattern="9\d{8}"
                              title="Please enter a valid Portuguese mobile number (9 digits starting with 9)"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                            Service Address
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="address"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="123 Main St, Apt 4B"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                            ZIP Code
                          </label>
                          <div className="mt-1">
                            <input
                              type="text"
                              id="zipCode"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="12345"
                            />
                          </div>
                        </div>

                        <div>
                          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                            Additional Notes
                          </label>
                          <div className="mt-1">
                            <textarea
                              id="notes"
                              rows={3}
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                              placeholder="Any special requirements or instructions..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-between">
                          <button
                            type="button"
                            onClick={(e) => handleStepChange(2, e)}
                            className="inline-flex items-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                          >
                            <ArrowLeft className="mr-2 h-5 w-5" />
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={!name || !email || !phone || !address || !zipCode}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                          >
                            Book Now
                            <CheckCircle className="ml-2 h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-gray-900">Booking Successful!</h3>
                  <p className="mt-2 text-gray-600">
                    Thank you for choosing our services. We'll be in touch shortly with confirmation details.
                  </p>
                  <div className="mt-8">
                    <button
                      type="button"
                      onClick={() => setBookingSuccess(false)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                    >
                      Book Another Service
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-12">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-500">
              &copy; {new Date().getFullYear()} M.M.C Services. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}