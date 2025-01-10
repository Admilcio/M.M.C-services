import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Mail, Phone, Star, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { Toaster, toast } from 'react-hot-toast';
import { supabase } from './lib/supabase';

interface Service {
  id: string;
  name: string;
  description: string;
  price_per_hour: number;
}

const serviceImages = {
  'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=1000',
  'Cooking': 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1000',
  'Babysitting': 'https://images.unsplash.com/photo-1602006655394-e7a39fc3087e?auto=format&fit=crop&q=80&w=1000',
  'Decorating': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&q=80&w=1000'
};

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*');
    
    if (error) {
      toast.error('Error loading services');
      return;
    }

    setServices(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedService || !date || !startTime || !endTime || !name || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert([
        { full_name: name, email, phone }
      ])
      .select()
      .single();

    if (customerError) {
      toast.error('Error creating customer');
      return;
    }

    const { error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          customer_id: customerData.id,
          service_id: selectedService,
          booking_date: date,
          start_time: startTime,
          end_time: endTime,
          notes
        }
      ]);

    if (bookingError) {
      toast.error('Error creating booking');
      return;
    }

    toast.success('Booking submitted successfully!');
    
    // Reset form
    setSelectedService('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setName('');
    setEmail('');
    setPhone('');
    setNotes('');
    setActiveStep(1);
  };

  const nextStep = () => {
    if (activeStep === 1 && !selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (activeStep === 2 && (!date || !startTime || !endTime)) {
      toast.error('Please fill in all date and time fields');
      return;
    }
    setActiveStep(prev => prev + 1);
  };

  const prevStep = () => {
    setActiveStep(prev => prev - 1);
  };

  const selectedServiceData = services.find(s => s.id === selectedService);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">M.M.C Services</h1>
                <p className="mt-1 text-sm text-gray-500">Book your service today</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              <p>Open daily</p>
              <p className="font-semibold">7:00 AM - 6:00 PM</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                activeStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`h-1 w-24 mx-2 transition-all ${
                  activeStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Service Selection */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Select a Service</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-lg ${
                        selectedService === service.id
                          ? 'border-blue-500 bg-blue-50/50 transform scale-[1.02]'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={serviceImages[service.name as keyof typeof serviceImages]}
                          alt={service.name}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-lg" />
                      </div>
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <p className="text-gray-600 text-sm mb-2">{service.description}</p>
                      <p className="text-blue-600 font-semibold">${service.price_per_hour}/hour</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Date and Time */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Choose Date & Time</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline-block w-4 h-4 mr-1" />
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      min="07:00"
                      max="17:00"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline-block w-4 h-4 mr-1" />
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      min="08:00"
                      max="18:00"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Contact Information */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="inline-block w-4 h-4 mr-1" />
                      Email *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline-block w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Any special requirements or instructions..."
                  />
                </div>

                {selectedServiceData && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Booking Summary</h3>
                    <p>Service: {selectedServiceData.name}</p>
                    <p>Date: {date}</p>
                    <p>Time: {startTime} - {endTime}</p>
                    <p>Price: ${selectedServiceData.price_per_hour}/hour</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              {activeStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Previous
                </button>
              )}
              {activeStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="ml-auto bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  className="ml-auto bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  Book Now
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;