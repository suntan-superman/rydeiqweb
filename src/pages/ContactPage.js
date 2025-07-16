import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const ContactPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Contact form data:', data);
      toast.success('Message sent successfully! We\'ll get back to you within 24 hours.');
      reset();
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Contact RydeAlong
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get in touch with our team. Whether you're a driver, rider, or potential partner, 
            we're here to help you succeed with RydeAlong.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="First Name"
                    {...register('firstName', { required: 'First name is required' })}
                    error={errors.firstName?.message}
                    placeholder="John"
                  />
                </div>
                <div>
                  <Input
                    label="Last Name"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <Input
                label="Email Address"
                type="email"
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                error={errors.email?.message}
                placeholder="john@example.com"
              />

              <Input
                label="Phone Number"
                type="tel"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a *
                </label>
                <select
                  {...register('userType', { required: 'Please select your role' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select your role</option>
                  <option value="rider">Rider</option>
                  <option value="driver">Driver</option>
                  <option value="fleet_owner">Fleet Owner</option>
                  <option value="taxi_company">Taxi Company</option>
                  <option value="investor">Investor</option>
                  <option value="media">Media</option>
                  <option value="partner">Potential Partner</option>
                  <option value="other">Other</option>
                </select>
                {errors.userType && (
                  <p className="text-red-600 text-sm mt-1">{errors.userType.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  {...register('subject', { required: 'Please select a subject' })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a subject</option>
                  <option value="general_inquiry">General Inquiry</option>
                  <option value="driver_support">Driver Support</option>
                  <option value="rider_support">Rider Support</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="investment">Investment Inquiry</option>
                  <option value="media_press">Media/Press Inquiry</option>
                  <option value="technical_support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="feedback">Feedback</option>
                </select>
                {errors.subject && (
                  <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  {...register('message', { 
                    required: 'Message is required',
                    minLength: {
                      value: 10,
                      message: 'Message must be at least 10 characters'
                    }
                  })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us how we can help you..."
                />
                {errors.message && (
                  <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                )}
              </div>

              <Button
                type="submit"
                size="large"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Office Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Get in Touch</h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Headquarters</h4>
                    <p className="text-gray-600 mt-1">
                      123 Innovation Drive<br />
                      San Francisco, CA 94105<br />
                      United States
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email</h4>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>General: <a href="mailto:info@rydealong.com" className="text-primary-600 hover:text-primary-700">info@rydealong.com</a></p>
                      <p>Support: <a href="mailto:support@rydealong.com" className="text-primary-600 hover:text-primary-700">support@rydealong.com</a></p>
                      <p>Partnership: <a href="mailto:partners@rydealong.com" className="text-primary-600 hover:text-primary-700">partners@rydealong.com</a></p>
                      <p>Press: <a href="mailto:press@rydealong.com" className="text-primary-600 hover:text-primary-700">press@rydealong.com</a></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Phone</h4>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>Main: <a href="tel:+1-555-RYDEIQ" className="text-primary-600 hover:text-primary-700">+1 (555) RYDEIQ</a></p>
                      <p>Driver Support: <a href="tel:+1-555-DRIVER" className="text-primary-600 hover:text-primary-700">+1 (555) DRIVER</a></p>
                      <p>Rider Support: <a href="tel:+1-555-RIDER1" className="text-primary-600 hover:text-primary-700">+1 (555) RIDER1</a></p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Business Hours</h4>
                    <div className="text-gray-600 mt-1 space-y-1">
                      <p>Monday - Friday: 8:00 AM - 8:00 PM PST</p>
                      <p>Saturday: 9:00 AM - 6:00 PM PST</p>
                      <p>Sunday: 10:00 AM - 4:00 PM PST</p>
                      <p className="text-sm text-primary-600 mt-2">24/7 Emergency Driver Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
              
              <div className="space-y-4">
                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">How do I become a RydeAlong driver?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 text-gray-600">
                    Complete our simple 15-minute onboarding process. You'll need a valid driver's license, vehicle registration, insurance, and pass a background check.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">What makes RydeAlong different from Uber/Lyft?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 text-gray-600">
                    Drivers can set their own prices through competitive bidding, earning 80-90% vs. 40-50% with competitors. Riders benefit from no surge pricing and driver choice.
                  </div>
                </details>

                <details className="group">
                  <summary className="flex justify-between items-center cursor-pointer p-4 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">How quickly can I start earning?</span>
                    <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="p-4 text-gray-600">
                    Once approved (typically 24-48 hours), you can start accepting rides immediately. Payouts are available weekly (free), daily ($0.50), or instant ($1.50).
                  </div>
                </details>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Follow Us</h3>
              
              <div className="flex space-x-4">
                <a href="https://twitter.com/rydeiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="https://facebook.com/rydeiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-800 rounded-lg flex items-center justify-center text-white hover:bg-blue-900 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/rydeiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-pink-600 rounded-lg flex items-center justify-center text-white hover:bg-pink-700 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.09.109.105.2.077.311-.083.345-.266 1.077-.303 1.223-.05.171-.402.233-.402.233-.402-.402-1.14-1.462-1.14-2.345 0-3.096 2.25-5.942 6.477-5.942 3.401 0 6.05 2.423 6.05 5.66 0 3.374-2.125 6.089-5.078 6.089-.99 0-1.925-.515-2.244-1.134l-.614 2.355c-.221.857-.82 1.925-1.221 2.579C9.117 23.651 10.539 24.001 12.017 24.001c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                  </svg>
                </a>
                <a href="https://linkedin.com/company/rydeiq" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-700 rounded-lg flex items-center justify-center text-white hover:bg-blue-800 transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 