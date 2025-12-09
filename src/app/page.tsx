import Link from 'next/link';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  DevicePhoneMobileIcon,
  CloudArrowUpIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Ice Depth Monitoring',
    description: 'Interactive SVG rink diagrams with 25/35/47-point configurations and Gemini AI analysis.',
    icon: ChartBarIcon,
  },
  {
    name: 'Custom Form Builder',
    description: 'Drag-and-drop form builder with conditional logic, digital signatures, and auto-populated headers.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Compliance & Safety',
    description: 'Incident reporting with body diagrams, severity levels, and automatic GM notifications.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Mobile-First PWA',
    description: 'Offline-capable Progressive Web App optimized for ice technicians on the go.',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Cloud-Native',
    description: 'Built on Google Cloud Platform with auto-scaling, secure data storage, and 99.9% uptime.',
    icon: CloudArrowUpIcon,
  },
  {
    name: 'Real-Time Alerts',
    description: 'Configurable threshold alerts for air quality, equipment, and critical incidents.',
    icon: BoltIcon,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rink-900 to-rink-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-ice-500 to-ice-700 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <span className="font-bold text-rink-900 text-xl">Max Facility</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/auth/signin"
                className="text-rink-600 hover:text-rink-900 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signin"
                className="btn-primary"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Ice Rink Management
            <span className="block text-gradient bg-gradient-to-r from-ice-400 to-ice-200">
              Made Simple
            </span>
          </h1>
          <p className="text-xl text-rink-300 max-w-3xl mx-auto mb-10">
            Comprehensive SaaS platform for ice rink operations, compliance tracking,
            and analytics. Replace paper logs, ensure regulatory compliance, and get
            actionable insights for over 2,500 facilities.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signin"
              className="btn-primary btn-lg w-full sm:w-auto"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="btn bg-white/10 text-white hover:bg-white/20 btn-lg w-full sm:w-auto"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
            <div className="aspect-video bg-gradient-to-br from-rink-800 to-rink-900 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-ice-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChartBarIcon className="w-10 h-10 text-ice-400" />
                </div>
                <p className="text-rink-400 text-lg">Dashboard Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-rink-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-rink-500 max-w-2xl mx-auto">
              Eight integrated modules designed specifically for ice rink facilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="card p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-ice-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-ice-600" />
                </div>
                <h3 className="text-lg font-semibold text-rink-900 mb-2">
                  {feature.name}
                </h3>
                <p className="text-rink-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-16 bg-rink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-ice-600">2,500+</p>
              <p className="text-rink-500 mt-1">Rinks Served</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-ice-600">99.9%</p>
              <p className="text-rink-500 mt-1">Uptime SLA</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-ice-600">50K+</p>
              <p className="text-rink-500 mt-1">Daily Logs</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-ice-600">100%</p>
              <p className="text-rink-500 mt-1">Compliance</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-ice-600 to-ice-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Modernize Your Facility?
          </h2>
          <p className="text-xl text-ice-100 mb-8">
            Join hundreds of facilities already using Max Facility Operations
          </p>
          <Link
            href="/auth/signin"
            className="btn bg-white text-ice-700 hover:bg-ice-50 btn-lg"
          >
            Start Your Free Trial
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-rink-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-ice-500 to-ice-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <span className="font-semibold text-white">Max Facility Operations</span>
            </div>
            <p className="text-rink-400 text-sm">
              © {new Date().getFullYear()} Max Facility Operations. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
