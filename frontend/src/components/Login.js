import React from 'react';
import { Users, BookOpen, BarChart3, Shield, Zap, Globe } from 'lucide-react';

const Login = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-16.569 13.431-30 30-30v60c-16.569 0-30-13.431-30-30z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Hero Content */}
          <div className="text-white space-y-8 animate-slideInLeft">
            <div className="space-y-4">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Shiksha-Connect
                </h1>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                AI-Powered
                <span className="block bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  School Management
                </span>
              </h2>
              
              <p className="text-xl text-blue-100 leading-relaxed">
                Revolutionize attendance tracking and student analytics with advanced AI technology. 
                Built specifically for Indian schools and educational institutions.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Smart Attendance</h3>
                  <p className="text-sm text-blue-200">Facial recognition & offline support</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">AI Analytics</h3>
                  <p className="text-sm text-blue-200">Predictive insights & reporting</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure & Private</h3>
                  <p className="text-sm text-blue-200">DPDP Act compliant</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Multi-Language</h3>
                  <p className="text-sm text-blue-200">Hindi, English & regional</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex space-x-8 pt-6 border-t border-blue-800/30">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">500K+</div>
                <div className="text-sm text-blue-200">Students</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">1K+</div>
                <div className="text-sm text-blue-200">Schools</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">99.9%</div>
                <div className="text-sm text-blue-200">Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Card */}
          <div className="animate-slideInRight">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">Welcome Back</h3>
                  <p className="text-blue-100">Sign in to access your dashboard</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={onLogin}
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center space-x-3"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="text-center text-blue-200 text-sm">
                    Secure authentication powered by Emergent
                  </div>
                </div>

                {/* Features Preview */}
                <div className="pt-6 border-t border-white/10">
                  <p className="text-sm text-blue-200 mb-4">What you'll get access to:</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 text-blue-100">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>Real-time Dashboard</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-100">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>Student Management</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-100">
                      <BookOpen className="w-3 h-3 text-green-400" />
                      <span>Attendance Tracking</span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-100">
                      <BarChart3 className="w-3 h-3 text-orange-400" />
                      <span>AI Analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-6 text-center text-blue-200 text-sm">
              <p>Trusted by educational institutions across India</p>
              <div className="flex justify-center items-center space-x-4 mt-2 opacity-60">
                <span>🏫 Schools</span>
                <span>🎓 Colleges</span>
                <span>🏛️ Government</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;