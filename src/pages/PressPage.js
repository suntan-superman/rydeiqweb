import React, { useState } from 'react';
import Button from '../components/common/Button';

const PressPage = () => {
  const [selectedRelease, setSelectedRelease] = useState(null);

  const pressReleases = [
    {
      id: 1,
      title: 'AnyRyde Launches Revolutionary Competitive Bidding Platform for Ride-Sharing',
      date: 'January 15, 2025',
      summary: 'AnyRyde today announced the launch of its innovative ride-sharing platform that allows drivers to set their own prices through competitive bidding, eliminating surge pricing and creating fairer earnings for drivers.',
      content: `SAN FRANCISCO, CA - January 15, 2025 - AnyRyde, a revolutionary ride-sharing platform, today announced its official launch with a game-changing competitive bidding system that empowers drivers to set their own prices while eliminating surge pricing for riders.

Unlike traditional ride-sharing platforms that take 50-60% commissions, AnyRyde operates on a transparent 10-20% commission model, allowing drivers to keep 80-90% of their earnings. The platform's unique bidding system enables drivers to compete for rides based on their availability, location, and preferred pricing, while riders can choose drivers based on price, rating, vehicle type, and estimated arrival time.

"We're fundamentally changing how ride-sharing works," said Joseph Roy, CEO and Co-Founder of AnyRyde. "Our platform puts control back in the hands of drivers while giving riders transparency and choice they've never had before. No more surge pricing surprises, no more exploitation of drivers - just fair market competition that benefits everyone."

Key features of the AnyRyde platform include:
• Competitive driver bidding system
• Transparent pricing with no surge pricing
• 10-20% commission vs. industry standard 50-60%
• Real-time driver selection and comparison
• Comprehensive background checks and safety features
• Support for independent drivers and local taxi companies

The platform is initially launching in San Francisco, Los Angeles, and Seattle, with plans to expand to 10 additional markets by the end of 2025. AnyRyde has secured $15 million in Series A funding led by Andreessen Horowitz, with participation from Sequoia Capital and existing investors.

"AnyRyde represents the future of transportation - where market forces drive fair pricing and drivers have real economic opportunity," said Jeremy Richards, CTO and Co-Founder. "Our technology enables real-time bidding while maintaining the safety and reliability riders expect."

The company plans to use the funding to accelerate geographic expansion, enhance its mobile applications, and build partnerships with local taxi companies and fleet operators.

About AnyRyde:
Founded in 2024, AnyRyde is a San Francisco-based transportation technology company dedicated to creating fair and transparent ride-sharing experiences. The company's platform empowers drivers through competitive pricing while providing riders with choice, transparency, and cost savings. For more information, visit www.rydeiq.com.`
    },
    {
      id: 2,
      title: 'AnyRyde Raises $15M Series A to Expand Fair Ride-Sharing Platform',
      date: 'December 10, 2024',
      summary: 'Led by Andreessen Horowitz, the funding will accelerate AnyRyde\'s expansion to new markets and development of advanced driver earnings optimization features.',
      content: `SAN FRANCISCO, CA - December 10, 2024 - AnyRyde, the ride-sharing platform revolutionizing driver economics through competitive bidding, today announced it has raised $15 million in Series A funding led by Andreessen Horowitz, with participation from Sequoia Capital, GV (Google Ventures), and existing investors.

The funding will be used to accelerate geographic expansion, enhance the platform's real-time bidding technology, and develop advanced features for driver earnings optimization. AnyRyde plans to enter 10 new markets by the end of 2025, starting with major metropolitan areas on the West Coast and expanding nationwide.

"The ride-sharing industry has been dominated by platforms that extract enormous value from drivers while creating unpredictable pricing for riders," said Marc Andreessen, Co-Founder of Andreessen Horowitz. "AnyRyde's approach represents a fundamental improvement - using technology to create fair market dynamics that benefit both sides of the marketplace."

Since its beta launch six months ago, AnyRyde has demonstrated strong early traction:
• Over 5,000 drivers registered across three initial markets
• Average driver earnings 40% higher than traditional platforms
• 95% driver satisfaction rate
• Zero surge pricing incidents
• 30% lower average ride costs for riders during peak hours

The platform's success stems from its unique competitive bidding model, where drivers submit real-time price quotes for ride requests. Riders can see all available options and choose based on price, driver rating, vehicle type, and estimated arrival time. This creates natural price competition while eliminating the artificial scarcity that drives surge pricing.

"Traditional ride-sharing platforms have created a race to the bottom for driver earnings while subjecting riders to unpredictable pricing," said Joseph Roy, CEO of AnyRyde. "Our data shows that when drivers have pricing autonomy, they earn more while riders pay less on average. It's a win-win that the market has been waiting for."

The company also announced partnerships with three major taxi companies and plans to integrate with existing fleet management systems, allowing traditional transportation providers to access AnyRyde's rider network while maintaining their operational independence.

AnyRyde's technology platform includes advanced machine learning algorithms for demand prediction, optimal driver matching, and dynamic pricing recommendations that help drivers maximize their earnings while maintaining competitive rates.

About AnyRyde:
AnyRyde is transforming ride-sharing through fair market competition and transparent pricing. Founded in 2024, the company's platform empowers drivers to set their own prices while giving riders choice and eliminating surge pricing. Based in San Francisco, AnyRyde operates in California, Washington, and Oregon, with plans for nationwide expansion. For more information, visit www.rydeiq.com.`
    },
    {
      id: 3,
      title: 'AnyRyde Partners with Local Taxi Companies to Modernize Traditional Transportation',
      date: 'November 5, 2024',
      summary: 'Strategic partnerships bring licensed taxi operators onto AnyRyde\'s platform, providing digital tools while preserving their independence and local market knowledge.',
      content: `SAN FRANCISCO, CA - November 5, 2024 - AnyRyde today announced strategic partnerships with three major taxi companies, bringing licensed transportation providers onto its competitive bidding platform while preserving their operational independence and local market expertise.

The partnerships with Yellow Cab of San Francisco, Seattle Taxi, and Los Angeles Checker Cab represent AnyRyde's commitment to supporting traditional transportation providers rather than displacing them. These taxi companies will integrate their fleets with AnyRyde's platform, gaining access to digital booking tools and a broader customer base while maintaining their existing operations and pricing autonomy.

"We believe the transportation ecosystem is strongest when it includes diverse operators - from independent drivers to established taxi companies," said David Rodriguez, VP of Operations at AnyRyde. "These partnerships demonstrate that innovation doesn't have to come at the expense of traditional businesses that have served communities for decades."

Key benefits for partner taxi companies include:
• Access to AnyRyde's rider network and booking platform
• Digital fleet management and dispatch tools
• Real-time demand analytics and pricing insights
• Integration with existing operations and regulations
• Preservation of existing driver relationships and contracts

For riders, the partnerships provide additional benefits:
• Access to licensed, regulated taxi services
• Professional drivers with extensive local knowledge
• Wheelchair-accessible and specialty vehicles
• Airport pickup rights and dedicated taxi lanes
• Integration with AnyRyde's transparent pricing model

"Our drivers know the city better than anyone, and now they can compete on the same platform as ride-share drivers while maintaining the professional standards and licensing that our customers trust," said Maria Santos, General Manager of Yellow Cab of San Francisco.

The integration allows taxi companies to participate in AnyRyde's bidding system while maintaining their existing fare structures and regulatory compliance. Riders can easily identify licensed taxi services and choose them based on their preferences for regulated transportation, local expertise, or vehicle accessibility features.

AnyRyde plans to expand these partnerships to additional markets as it grows, with particular focus on airport-authorized operators and companies serving underserved communities where traditional taxi services play a crucial role.

The partnerships also include a commitment to driver training on AnyRyde's platform and technology, ensuring seamless integration while respecting existing employment relationships and union agreements where applicable.

About AnyRyde:
AnyRyde is revolutionizing ride-sharing through competitive bidding and fair market dynamics. The platform empowers all transportation providers - from independent drivers to established taxi companies - to compete fairly while giving riders unprecedented choice and transparency. Founded in 2024 and based in San Francisco, AnyRyde operates across the West Coast with plans for nationwide expansion. For more information, visit www.rydeiq.com.`
    }
  ];

  const companyFacts = [
    { label: 'Founded', value: '2024' },
    { label: 'Headquarters', value: 'San Francisco, CA' },
    { label: 'Employees', value: '85+' },
    { label: 'Markets', value: '3 (expanding to 10)' },
    { label: 'Registered Drivers', value: '5,000+' },
    { label: 'Completed Rides', value: '50,000+' },
    { label: 'Driver Commission', value: '10-20%' },
    { label: 'Average Driver Earnings Increase', value: '40%' },
    { label: 'Surge Pricing Incidents', value: '0' },
    { label: 'Driver Satisfaction Rate', value: '95%' }
  ];

  const mediaKit = [
    {
      type: 'Logo Package',
      description: 'High-resolution logos in various formats',
      download: '#'
    },
    {
      type: 'Product Screenshots',
      description: 'App interface and platform screenshots',
      download: '#'
    },
    {
      type: 'Executive Photos',
      description: 'High-resolution headshots of leadership team',
      download: '#'
    },
    {
      type: 'Company Fact Sheet',
      description: 'Key statistics and company information',
      download: '#'
    },
    {
      type: 'Brand Guidelines',
      description: 'Logo usage, colors, and brand standards',
      download: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AnyRyde Press Room
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Latest news, updates, and media resources about the future of fair ride-sharing
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                Download Media Kit
              </Button>
              <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                Contact Media Relations
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Latest News */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Latest News
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay up to date with AnyRyde's latest announcements, partnerships, and milestones
            </p>
          </div>

          <div className="space-y-8">
            {pressReleases.map((release) => (
              <div key={release.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-primary-600 font-medium">{release.date}</span>
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setSelectedRelease(selectedRelease?.id === release.id ? null : release)}
                    >
                      {selectedRelease?.id === release.id ? 'Hide' : 'Read Full Release'}
                    </Button>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{release.title}</h3>
                  <p className="text-gray-600 text-lg leading-relaxed">{release.summary}</p>
                  
                  {selectedRelease?.id === release.id && (
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <div className="prose max-w-none">
                        {release.content.split('\n\n').map((paragraph, index) => (
                          <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                            {paragraph}
                          </p>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 mt-8 pt-6 border-t border-gray-100">
                        <Button size="small">
                          Download PDF
                        </Button>
                        <Button variant="outline" size="small">
                          Share on LinkedIn
                        </Button>
                        <Button variant="outline" size="small">
                          Share on Twitter
                        </Button>
                        <Button variant="outline" size="small">
                          Copy Link
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Facts */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Company Facts
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Key statistics and information about AnyRyde's growth and impact
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {companyFacts.map((fact, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">{fact.value}</div>
                <div className="text-gray-600 text-sm">{fact.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Media Kit */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Media Kit
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Download high-quality assets, images, and brand materials for your stories
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mediaKit.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{item.type}</h3>
                <p className="text-gray-600 mb-6">{item.description}</p>
                <Button variant="outline" className="w-full">
                  Download
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Team */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Executive Team
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Meet the leadership team driving AnyRyde's mission
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">JS</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Joseph Roy</h3>
              <p className="text-primary-600 font-medium mb-4">CEO & Co-Founder</p>
              <p className="text-gray-600 text-sm mb-4">
                Former VP of Operations at major ride-sharing company. 15+ years in transportation and logistics.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" size="small">
                  Bio & Photos
                </Button>
                <Button variant="outline" size="small">
                  LinkedIn
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">SR</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Jeremy Richards</h3>
              <p className="text-primary-600 font-medium mb-4">CTO & Co-Founder</p>
              <p className="text-gray-600 text-sm mb-4">
                Former Senior Engineering Director at Google. Expert in real-time systems and mobile applications.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" size="small">
                  Bio & Photos
                </Button>
                <Button variant="outline" size="small">
                  LinkedIn
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">MJ</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dr. Rick Pierucci </h3>
              <p className="text-primary-600 font-medium mb-4">CFO</p>
              <p className="text-gray-600 text-sm mb-4">
                Former Investment Director at Sequoia Capital. Specialized in transportation and marketplace investments.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" size="small">
                  Bio & Photos
                </Button>
                <Button variant="outline" size="small">
                  LinkedIn
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Media Contact */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-3xl text-white p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Media Inquiries
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              For press inquiries, interview requests, or additional information, 
              please contact our media relations team.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white bg-opacity-10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Press Contact</h3>
                <p className="mb-2">Stan Roy</p>
                <p className="mb-2">VP of Marketing</p>
                <p className="mb-2">press@rydealong.com</p>
                <p>+1 (555) 123-PRESS</p>
              </div>
              
              <div className="bg-white bg-opacity-10 rounded-2xl p-8">
                <h3 className="text-xl font-bold mb-4">Investor Relations</h3>
                <p className="mb-2">Dr. Rick Pierucci </p>
                <p className="mb-2">Chief Financial Officer</p>
                <p className="mb-2">investors@rydealong.com</p>
                <p>+1 (555) 123-INVEST</p>
              </div>
            </div>
            
            <div className="mt-8">
              <Button size="large" variant="outline" className="text-white border-white hover:bg-white hover:text-primary-600">
                Schedule Executive Interview
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PressPage; 