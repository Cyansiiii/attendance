import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Calendar,
  Users,
  Camera,
  UserCheck,
  UserX,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Scan,
  Save,
  RefreshCw,
  Loader2,
  UserPlus,
  Check,
  X
} from 'lucide-react';
import Webcam from 'react-webcam';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AttendanceMarking = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState({});
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [markingMode, setMarkingMode] = useState('manual'); // manual, facial, batch
  const [showCamera, setShowCamera] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [recognitionInProgress, setRecognitionInProgress] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [recognitionStatus, setRecognitionStatus] = useState('idle'); // idle, scanning, success, error

  const webcamRef = useRef(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
      fetchAttendance();
    }
  }, [selectedClass, selectedSection, selectedDate]);

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`${API}/classes`);
      setClasses(response.data);
      
      // Auto-select first class if available
      const firstClass = Object.keys(response.data)[0];
      if (firstClass && !selectedClass) {
        setSelectedClass(firstClass);
        setSelectedSection(response.data[firstClass][0]?.section || '');
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      toast.error('Failed to fetch classes');
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('class_name', selectedClass);
      if (selectedSection) params.append('section', selectedSection);
      
      const response = await axios.get(`${API}/students?${params}`);
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      params.append('date', selectedDate);
      if (selectedClass) params.append('class_name', selectedClass);
      if (selectedSection) params.append('section', selectedSection);
      
      const response = await axios.get(`${API}/attendance?${params}`);
      
      // Convert attendance array to object for easy lookup
      const attendanceMap = {};
      response.data.forEach(record => {
        attendanceMap[record.student_id] = record.status;
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const markAttendance = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
    setHasUnsavedChanges(true);
  };

  const markAllPresent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = 'present';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    setHasUnsavedChanges(true);
    toast.success(`Marked ${filteredStudents.length} students as present`);
  };

  const markAllAbsent = () => {
    const newAttendance = {};
    filteredStudents.forEach(student => {
      newAttendance[student.id] = 'absent';
    });
    setAttendance(prev => ({ ...prev, ...newAttendance }));
    setHasUnsavedChanges(true);
    toast.success(`Marked ${filteredStudents.length} students as absent`);
  };

  const saveAttendance = async () => {
    try {
      setIsSaving(true);
      
      const attendanceData = {
        student_ids: Object.keys(attendance),
        date: selectedDate,
        status: 'mixed', // Will be handled per student on backend
        method: markingMode
      };

      // Group students by status for batch processing
      const statusGroups = {
        present: [],
        absent: [],
        late: []
      };

      Object.entries(attendance).forEach(([studentId, status]) => {
        if (statusGroups[status]) {
          statusGroups[status].push(studentId);
        }
      });

      // Send separate requests for each status
      const requests = [];
      Object.entries(statusGroups).forEach(([status, studentIds]) => {
        if (studentIds.length > 0) {
          requests.push(
            axios.post(`${API}/attendance/mark`, {
              student_ids: studentIds,
              date: selectedDate,
              status: status,
              method: markingMode
            })
          );
        }
      });

      await Promise.all(requests);
      
      setHasUnsavedChanges(false);
      toast.success('Attendance saved successfully!');
      
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Failed to save attendance');
    } finally {
      setIsSaving(false);
    }
  };

  const startFacialRecognition = () => {
    setShowCamera(true);
    setMarkingMode('facial');
  };

  const processFacialRecognition = async () => {
    try {
      setRecognitionInProgress(true);
      setRecognitionStatus('scanning');
      
      const imageSrc = webcamRef.current.getScreenshot();
      
      // In a real implementation, this would send the image to a backend API
      // that performs facial recognition and returns matched student IDs
      
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate recognition results - in a real app, this would come from the API
      const recognizedIds = [];
      const recognizedNames = [];
      
      // Find random students to mark as recognized (for demo purposes)
      const availableStudents = filteredStudents.filter(s => !recognizedStudents.some(rs => rs.id === s.id));
      const studentsToRecognize = availableStudents.slice(0, Math.min(3, availableStudents.length));
      
      studentsToRecognize.forEach(student => {
        recognizedIds.push(student.id);
        recognizedNames.push(student.name);
        
        // Mark the student as present
        markAttendance(student.id, 'present');
      });
      
      // Add newly recognized students to the list
      setRecognizedStudents(prev => [
        ...prev,
        ...studentsToRecognize.map(student => ({
          id: student.id,
          name: student.name,
          photo_url: student.photo_url,
          timestamp: new Date().toLocaleTimeString()
        }))
      ]);
      
      if (studentsToRecognize.length > 0) {
        setRecognitionStatus('success');
        toast.success(`Recognized ${studentsToRecognize.length} students!`);
      } else {
        setRecognitionStatus('error');
        toast.error('No new students recognized');
      }
      
      // Reset status after a delay
      setTimeout(() => {
        setRecognitionStatus('idle');
      }, 2000);
      
    } catch (error) {
      console.error('Error in facial recognition:', error);
      toast.error('Facial recognition failed');
      setRecognitionStatus('error');
    } finally {
      setRecognitionInProgress(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.roll_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendanceStats = {
    present: Object.values(attendance).filter(status => status === 'present').length,
    absent: Object.values(attendance).filter(status => status === 'absent').length,
    late: Object.values(attendance).filter(status => status === 'late').length,
    total: filteredStudents.length
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Attendance Marking</h1>
              <p className="mt-2 text-gray-600">
                Mark attendance for students using multiple methods
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={startFacialRecognition}
                className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-sm transition-colors"
              >
                <Scan className="w-4 h-4 mr-2" />
                Facial Recognition
              </button>
              {hasUnsavedChanges && (
                <button
                  onClick={saveAttendance}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Attendance
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Class */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setSelectedSection('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Class</option>
                {Object.keys(classes).map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            {/* Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!selectedClass}
              >
                <option value="">All Sections</option>
                {selectedClass && classes[selectedClass]?.map(section => (
                  <option key={section.section} value={section.section}>
                    {section.section}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={markAllPresent}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                >
                  All Present
                </button>
                <button
                  onClick={markAllAbsent}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs"
                >
                  All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{attendanceStats.total}</div>
              <div className="text-sm text-blue-800">Total Students</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
              <div className="text-sm text-green-800">Present</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
              <div className="text-sm text-red-800">Absent</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-600">{attendanceStats.late}</div>
              <div className="text-sm text-yellow-800">Late</div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No students found</p>
              <p className="text-gray-400 text-sm">Select a class and section to view students</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredStudents.map((student) => {
                const currentStatus = attendance[student.id] || 'not_marked';
                
                return (
                  <div key={student.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                          {student.photo_url ? (
                            <img
                              src={student.photo_url}
                              alt={student.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-white font-medium">
                              {student.name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            Roll: {student.roll_number} • {student.class_name} - {student.section}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Status Indicator */}
                        <div className="mr-4">
                          {currentStatus === 'present' && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle2 className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Present</span>
                            </div>
                          )}
                          {currentStatus === 'absent' && (
                            <div className="flex items-center text-red-600">
                              <XCircle className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Absent</span>
                            </div>
                          )}
                          {currentStatus === 'late' && (
                            <div className="flex items-center text-yellow-600">
                              <Clock className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Late</span>
                            </div>
                          )}
                          {currentStatus === 'not_marked' && (
                            <div className="flex items-center text-gray-400">
                              <AlertCircle className="w-5 h-5 mr-1" />
                              <span className="text-sm font-medium">Not Marked</span>
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => markAttendance(student.id, 'present')}
                            className={`p-2 rounded-lg transition-colors ${
                              currentStatus === 'present'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                            }`}
                            title="Mark Present"
                          >
                            <UserCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, 'late')}
                            className={`p-2 rounded-lg transition-colors ${
                              currentStatus === 'late'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700'
                            }`}
                            title="Mark Late"
                          >
                            <Clock className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => markAttendance(student.id, 'absent')}
                            className={`p-2 rounded-lg transition-colors ${
                              currentStatus === 'absent'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                            }`}
                            title="Mark Absent"
                          >
                            <UserX className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Camera Modal for Facial Recognition */}
        {showCamera && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-5xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Facial Recognition Attendance</h3>
                <button
                  onClick={() => setShowCamera(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="relative mb-4">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      className="w-full rounded-lg"
                      videoConstraints={{
                        width: 640,
                        height: 480,
                        facingMode: "user"
                      }}
                    />
                    
                    {/* Face detection overlay */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`w-64 h-64 border-4 rounded-full transition-colors duration-300 ${recognitionStatus === 'scanning' ? 'border-yellow-400 animate-pulse' : recognitionStatus === 'success' ? 'border-green-500' : recognitionStatus === 'error' ? 'border-red-500' : 'border-blue-400 border-dashed'}`}></div>
                    </div>
                    
                    {/* Status indicator */}
                    <div className={`absolute top-2 left-2 px-3 py-1 rounded-full text-sm font-medium ${recognitionStatus === 'scanning' ? 'bg-yellow-100 text-yellow-800' : recognitionStatus === 'success' ? 'bg-green-100 text-green-800' : recognitionStatus === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {recognitionStatus === 'scanning' ? 'Scanning...' : 
                       recognitionStatus === 'success' ? 'Student Recognized!' : 
                       recognitionStatus === 'error' ? 'Recognition Failed' : 
                       'Ready to Scan'}
                    </div>
                  </div>
                  
                  <div className="text-center text-gray-600 mb-4">
                    <p>Position students in front of the camera for automatic attendance marking</p>
                    <p className="text-sm">AI will detect faces and match them with enrolled students</p>
                  </div>
                  
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowCamera(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={processFacialRecognition}
                      disabled={recognitionInProgress}
                      className={`px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center ${recognitionInProgress ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {recognitionInProgress ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4 mr-2" />
                          Recognize Students
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Recognized Students</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      {recognizedStudents.length} students
                    </span>
                  </div>
                  
                  {recognizedStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No students recognized yet</p>
                      <p className="text-gray-400 text-sm">Click "Recognize Students" to start</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-96 space-y-3">
                      {recognizedStudents.map((student, index) => (
                        <div key={`${student.id}-${index}`} className="flex items-center bg-white p-3 rounded-lg shadow-sm">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                            {student.photo_url ? (
                              <img
                                src={student.photo_url}
                                alt={student.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {student.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500">{student.timestamp}</div>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="flex items-center text-green-600">
                              <Check className="w-4 h-4 mr-1" />
                              <span className="text-xs">Present</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {recognizedStudents.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button 
                        onClick={() => setRecognizedStudents([])} 
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Clear All
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceMarking;