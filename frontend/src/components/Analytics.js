import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Calendar,
  Download,
  Filter,
  Brain,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Clock,
  UserCheck,
  BookOpen
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = ({ user }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('30');
  const [selectedClass, setSelectedClass] = useState('');
  const [generatingInsights, setGeneratingInsights] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedDateRange, selectedClass]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(selectedDateRange));
      
      const requestData = {
        date_range: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        }
      };
      
      if (selectedClass) {
        requestData.class_filter = selectedClass;
      }
      
      const response = await axios.post(`${API}/analytics/insights`, requestData);
      setAnalyticsData(response.data.analytics);
      setAiInsights(response.data.ai_insights);
      
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const generateNewInsights = async () => {
    try {
      setGeneratingInsights(true);
      await fetchAnalyticsData();
      toast.success('AI insights updated!');
    } catch (error) {
      toast.error('Failed to generate insights');
    } finally {
      setGeneratingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl h-32"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const attendanceByStatus = analyticsData?.attendance_by_status || {};
  const attendanceByClass = analyticsData?.attendance_by_class || {};

  const pieData = Object.entries(attendanceByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#f59e0b'
  }));

  const classData = Object.entries(attendanceByClass).map(([className, count]) => ({
    class: className,
    attendance: count,
    fill: '#3b82f6'
  }));

  // Generate trend data (mock for demonstration)
  const trendData = Array.from({ length: parseInt(selectedDateRange) }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (parseInt(selectedDateRange) - i - 1));
    
    return {
      date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      present: Math.floor(Math.random() * 50) + 150,
      absent: Math.floor(Math.random() * 20) + 10,
      rate: Math.floor(Math.random() * 10) + 85
    };
  });

  const stats = [
    {
      title: 'Total Students',
      value: analyticsData?.total_students || 0,
      icon: Users,
      color: 'blue',
      change: '+5.2%',
      period: 'vs last period'
    },
    {
      title: 'Attendance Records',
      value: analyticsData?.total_attendance_records || 0,
      icon: UserCheck,
      color: 'green',
      change: '+12.1%',
      period: 'this period'
    },
    {
      title: 'Average Attendance',
      value: attendanceByStatus.present ? 
        `${((attendanceByStatus.present / (attendanceByStatus.present + attendanceByStatus.absent || 1)) * 100).toFixed(1)}%` 
        : '0%',
      icon: TrendingUp,
      color: 'purple',
      change: '+2.5%',
      period: 'improvement'
    },
    {
      title: 'At-Risk Students',
      value: Math.floor((attendanceByStatus.absent || 0) * 0.3),
      icon: AlertTriangle,
      color: 'red',
      change: '-1.8%',
      period: 'reduced'
    },
    {
      title: 'Classes Active',
      value: Object.keys(attendanceByClass).length,
      icon: BookOpen,
      color: 'indigo',
      change: '+3',
      period: 'new classes'
    },
    {
      title: 'Punctuality Rate',
      value: '92.4%',
      icon: Clock,
      color: 'orange',
      change: '+4.1%',
      period: 'improvement'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>
              <p className="mt-2 text-gray-600">
                AI-powered attendance analytics and predictive insights
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={generateNewInsights}
                disabled={generatingInsights}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Brain className={`w-4 h-4 mr-2 ${generatingInsights ? 'animate-spin' : ''}`} />
                {generatingInsights ? 'Generating...' : 'Generate AI Insights'}
              </button>
              <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-50 text-blue-600',
              green: 'bg-green-50 text-green-600',
              purple: 'bg-purple-50 text-purple-600',
              red: 'bg-red-50 text-red-600',
              indigo: 'bg-indigo-50 text-indigo-600',
              orange: 'bg-orange-50 text-orange-600'
            };

            return (
              <div
                key={stat.title}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className="text-sm text-emerald-600 font-medium">{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">{stat.period}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color]}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Attendance Trend */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Attendance Trends</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
              </div>
            </div>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="present"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="absent"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Class-wise Attendance */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Class-wise Performance</h2>
            
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="class" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Attendance Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Distribution</h2>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
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
          
          {/* AI Insights */}
          <div className="lg:col-span-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center space-x-2 mb-6">
              <Brain className="w-6 h-6 text-purple-600" />
              <h2 className="text-xl font-bold text-purple-900">AI-Powered Insights</h2>
            </div>
            
            {aiInsights ? (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {aiInsights}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 text-center">
                <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                <p className="text-purple-800 mb-4">Generate AI insights to get detailed analytics</p>
                <button
                  onClick={generateNewInsights}
                  disabled={generatingInsights}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {generatingInsights ? 'Generating...' : 'Generate Insights'}
                </button>
              </div>
            )}
            
            {/* Key Recommendations */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Recommendation</span>
                </div>
                <p className="text-sm text-gray-700">
                  Focus on Class 8-A which shows declining attendance patterns
                </p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Achievement</span>
                </div>
                <p className="text-sm text-gray-700">
                  Class 10-B achieved 98% attendance this month
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;