import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp, 
  Calendar,
  School,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Brain
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('7');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/analytics/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl h-32"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-2xl h-80"></div>
              <div className="bg-white p-6 rounded-2xl h-80"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const attendanceRate = dashboardData?.attendance_rate || 0;
  const trends = dashboardData?.trends || [];
  
  // Prepare chart data
  const chartData = trends.map(trend => ({
    date: formatDate(trend.date),
    present: trend.present,
    total: trend.total,
    rate: trend.total > 0 ? (trend.present / trend.total * 100).toFixed(1) : 0
  }));

  const pieData = [
    { name: 'Present', value: dashboardData?.today_present || 0, color: '#10b981' },
    { name: 'Absent', value: dashboardData?.today_absent || 0, color: '#ef4444' }
  ];

  const stats = [
    {
      title: 'Total Students',
      value: dashboardData?.total_students || 0,
      icon: Users,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%'
    },
    {
      title: 'Today Present',
      value: dashboardData?.today_present || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+5%'
    },
    {
      title: 'Today Absent',
      value: dashboardData?.today_absent || 0,
      icon: UserX,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      change: '-2%'
    },
    {
      title: 'Attendance Rate',
      value: `${attendanceRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+3%'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">
                Welcome back, {user.name}! Here's what's happening at your school today.
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-IN', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 animate-fadeIn`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-emerald-600 font-medium">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-xl`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Attendance Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slideInLeft">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attendance Trends</h2>
              <select 
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
              </select>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="present" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Today's Attendance Pie Chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slideInRight">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Today's Attendance</h2>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slideInLeft">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <a
                href="/attendance"
                className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer group"
              >
                <UserCheck className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-blue-900">Mark Attendance</span>
              </a>
              
              <a
                href="/students"
                className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer group"
              >
                <Users className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-green-900">Manage Students</span>
              </a>
              
              <a
                href="/analytics"
                className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer group"
              >
                <BarChart3 className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-purple-900">View Analytics</span>
              </a>
              
              <div className="flex flex-col items-center p-4 bg-orange-50 rounded-xl cursor-pointer group">
                <School className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-medium text-orange-900">School Settings</span>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 animate-slideInRight">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="w-6 h-6 text-indigo-600" />
              <h2 className="text-xl font-bold text-indigo-900">AI Insights</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Attendance rate improved by 8% this week
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Great work on the new attendance system implementation!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      3 students at risk of dropping out
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Consider scheduling parent meetings for early intervention
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Monday has the highest attendance rate
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Schedule important activities on Mondays for better participation
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;