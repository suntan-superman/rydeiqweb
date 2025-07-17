import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

const CareersPage = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const jobs = [
    {
      id: 1,
      title: 'Senior Software Engineer - Backend',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '5+ years',
      description: 'Build scalable backend systems for our real-time bidding platform. Work with Firebase, Node.js, and microservices architecture.',
      requirements: [
        '5+ years of backend development experience',
        'Expertise in Node.js, Python, or Go',
        'Experience with real-time systems and WebSockets',
        'Knowledge of Firebase, MongoDB, or PostgreSQL',
        'Experience with microservices architecture'
      ],
      responsibilities: [
        'Design and implement scalable backend APIs',
        'Optimize real-time bidding algorithms',
        'Collaborate with frontend and mobile teams',
        'Ensure system reliability and performance',
        'Mentor junior developers'
      ]
    },
    {
      id: 2,
      title: 'Mobile App Developer - React Native',
      department: 'Engineering',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Develop our driver and rider mobile applications using React Native. Focus on real-time features and excellent user experience.',
      requirements: [
        '3+ years of React Native development',
        'Experience with iOS and Android platforms',
        'Knowledge of real-time features and push notifications',
        'Experience with Google Maps API',
        'Understanding of mobile UX best practices'
      ],
      responsibilities: [
        'Develop and maintain mobile applications',
        'Implement real-time features and notifications',
        'Optimize app performance and user experience',
        'Collaborate with design and backend teams',
        'Ensure cross-platform compatibility'
      ]
    },
    {
      id: 3,
      title: 'Product Manager - Driver Experience',
      department: 'Product',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Lead product strategy for driver-facing features. Focus on driver earnings optimization and platform usability.',
      requirements: [
        '4+ years of product management experience',
        'Experience in marketplace or gig economy platforms',
        'Strong analytical and data-driven decision making',
        'Excellent communication and leadership skills',
        'Understanding of driver economics and motivations'
      ],
      responsibilities: [
        'Define product roadmap for driver features',
        'Conduct user research and gather feedback',
        'Collaborate with engineering and design teams',
        'Analyze driver metrics and optimize experience',
        'Work with operations on driver onboarding'
      ]
    },
    {
      id: 4,
      title: 'Data Scientist',
      department: 'Data & Analytics',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Build machine learning models for pricing optimization, demand forecasting, and driver-rider matching.',
      requirements: [
        '3+ years of data science experience',
        'Expertise in Python, R, or similar languages',
        'Experience with machine learning frameworks',
        'Knowledge of statistical analysis and modeling',
        'Experience with large-scale data processing'
      ],
      responsibilities: [
        'Develop pricing optimization algorithms',
        'Build demand forecasting models',
        'Improve driver-rider matching systems',
        'Analyze platform performance metrics',
        'Collaborate with product and engineering teams'
      ]
    },
    {
      id: 5,
      title: 'UX/UI Designer',
      department: 'Design',
      location: 'San Francisco, CA / Remote',
      type: 'Full-time',
      experience: '4+ years',
      description: 'Design intuitive user experiences for our web and mobile platforms. Focus on driver and rider journey optimization.',
      requirements: [
        '4+ years of UX/UI design experience',
        'Proficiency in Figma, Sketch, or similar tools',
        'Experience with mobile and web design',
        'Understanding of user research methodologies',
        'Portfolio demonstrating excellent design work'
      ],
      responsibilities: [
        'Design user interfaces for web and mobile',
        'Conduct user research and usability testing',
        'Create design systems and component libraries',
        'Collaborate with product and engineering teams',
        'Ensure consistent brand experience'
      ]
    },
    {
      id: 6,
      title: 'Marketing Manager - Growth',
      department: 'Marketing',
      location: 'San Francisco, CA',
      type: 'Full-time',
      experience: '3+ years',
      description: 'Drive user acquisition and retention strategies for both drivers and riders. Focus on digital marketing and growth hacking.',
      requirements: [
        '3+ years of digital marketing experience',
        'Experience with performance marketing',
        'Knowledge of SEO, SEM, and social media marketing',
        'Data-driven approach to marketing optimization',
        'Experience in two-sided marketplace growth'
      ],
      responsibilities: [
        'Develop and execute growth strategies',
        'Manage digital marketing campaigns',
        'Optimize conversion funnels',
        'Analyze marketing performance metrics',
        'Collaborate with product and design teams'
      ]
    }
  ];

  const benefits = [
    {
      icon: '💰',
      title: 'Competitive Salary',
      description: 'Top-tier compensation packages with equity options'
    },
    {
      icon: '🏥',
      title: 'Health & Wellness',
      description: 'Comprehensive health, dental, and vision insurance'
    },
    {
      icon: '🏖️',
      title: 'Flexible PTO',
      description: 'Unlimited vacation policy and personal days'
    },
    {
      icon: '🏠',
      title: 'Remote Work',
      description: 'Flexible remote work options for all positions'
    },
    {
      icon: '📚',
      title: 'Learning Budget',
      description: '$2,000 annual budget for courses and conferences'
    },
    {
      icon: '🍎',
      title: 'Wellness Perks',
      description: 'Gym membership, healthy snacks, and mental health support'
    }
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Application data:', { ...data, jobId: selectedJob?.id });
      toast.success('Application submitted successfully! We\'ll review it and get back to you soon.');
      reset();
      setSelectedJob(null);
    } catch (error) {
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Join the AnyRyde Team
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Help us build the future of fair and transparent transportation. 
              Make a meaningful impact while working with amazing people.
            </p>
            <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
              View Open Positions
            </Button>
          </div>
        </div>
      </div>

      {/* Why Work Here */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Work at AnyRyde?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're building something meaningful - a platform that creates fair opportunities 
              for drivers and better experiences for riders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Mission-Driven</h3>
              <p className="text-gray-600">
                Work on technology that directly improves people's lives and creates fairer economic opportunities.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Collaborative Culture</h3>
              <p className="text-gray-600">
                Work with talented, passionate people who value diversity, inclusion, and continuous learning.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Growth Opportunities</h3>
              <p className="text-gray-600">
                Rapid career growth in a fast-scaling startup with opportunities to own significant projects.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Cutting-Edge Tech</h3>
              <p className="text-gray-600">
                Work with modern technologies including React, React Native, Firebase, and real-time systems.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Work-Life Balance</h3>
              <p className="text-gray-600">
                Flexible schedules, remote work options, and a culture that respects personal time.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Equity & Impact</h3>
              <p className="text-gray-600">
                Meaningful equity participation and the opportunity to shape the future of transportation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Benefits & Perks
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We believe in taking care of our team with comprehensive benefits and meaningful perks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center p-6">
                <div className="text-4xl mb-4">{benefit.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Open Positions */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Open Positions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join us in building the future of transportation. We're looking for talented individuals 
              who share our passion for fairness and innovation.
            </p>
          </div>

          <div className="space-y-6">
            {jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{job.title}</h3>
                      <span className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium">
                        {job.department}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{job.type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span>{job.experience}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{job.description}</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 lg:ml-8">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
                    >
                      {selectedJob?.id === job.id ? 'Hide Details' : 'View Details'}
                    </Button>
                    <Button onClick={() => setSelectedJob(job)}>
                      Apply Now
                    </Button>
                  </div>
                </div>

                {selectedJob?.id === job.id && (
                  <div className="mt-8 pt-8 border-t border-gray-200">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Requirements</h4>
                        <ul className="space-y-2">
                          {job.requirements.map((req, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h4>
                        <ul className="space-y-2">
                          {job.responsibilities.map((resp, index) => (
                            <li key={index} className="flex items-start space-x-3">
                              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-700">{resp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Form Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Apply for {selectedJob.title}
                </h3>
                <button
                  onClick={() => setSelectedJob(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    {...register('firstName', { required: 'First name is required' })}
                    error={errors.firstName?.message}
                    placeholder="John"
                  />
                  <Input
                    label="Last Name"
                    {...register('lastName', { required: 'Last name is required' })}
                    error={errors.lastName?.message}
                    placeholder="Doe"
                  />
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

                <Input
                  label="LinkedIn Profile"
                  {...register('linkedin')}
                  placeholder="https://linkedin.com/in/yourprofile"
                />

                <Input
                  label="Portfolio/GitHub"
                  {...register('portfolio')}
                  placeholder="https://github.com/yourusername"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Letter *
                  </label>
                  <textarea
                    {...register('coverLetter', { 
                      required: 'Cover letter is required',
                      minLength: {
                        value: 100,
                        message: 'Cover letter must be at least 100 characters'
                      }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us why you're interested in this position and what makes you a great fit..."
                  />
                  {errors.coverLetter && (
                    <p className="text-red-600 text-sm mt-1">{errors.coverLetter.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    {...register('resume', { required: 'Resume is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {errors.resume && (
                    <p className="text-red-600 text-sm mt-1">{errors.resume.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX (Max 5MB)
                  </p>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedJob(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Don't See Your Dream Role?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            We're always looking for exceptional talent. Send us your resume and 
            let us know how you'd like to contribute to AnyRyde's mission.
          </p>
          <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
            Send Us Your Resume
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CareersPage; 