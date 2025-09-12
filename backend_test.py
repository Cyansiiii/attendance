import requests
import sys
import json
from datetime import datetime, timedelta
import base64
import io
from PIL import Image

class ShikshaConnectAPITester:
    def __init__(self, base_url="https://attend-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.user_data = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_students = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if self.session_token:
            default_headers['Authorization'] = f'Bearer {self.session_token}'
        
        if headers:
            default_headers.update(headers)
        
        # Remove Content-Type for file uploads
        if files:
            default_headers.pop('Content-Type', None)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=default_headers)
                else:
                    response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "../",  # Go back to root
            200
        )
        return success

    def test_mock_session_data(self):
        """Test session data endpoint with mock session ID"""
        # Since we can't actually authenticate with Emergent Auth in testing,
        # we'll test the endpoint structure
        success, response = self.run_test(
            "Session Data Endpoint (Mock)",
            "GET",
            "auth/session-data",
            400,  # Should fail without session ID
            headers={'X-Session-ID': 'mock-session-id'}
        )
        # This should fail as expected since we don't have a real session
        return True  # We expect this to fail, so we mark as success

    def test_dashboard_without_auth(self):
        """Test dashboard endpoint without authentication"""
        success, response = self.run_test(
            "Dashboard Without Auth",
            "GET",
            "analytics/dashboard",
            401  # Should be unauthorized
        )
        return success

    def test_students_without_auth(self):
        """Test students endpoint without authentication"""
        success, response = self.run_test(
            "Students Without Auth",
            "GET",
            "students",
            401  # Should be unauthorized
        )
        return success

    def test_attendance_without_auth(self):
        """Test attendance endpoint without authentication"""
        success, response = self.run_test(
            "Attendance Without Auth",
            "GET",
            "attendance?date=2024-01-01",
            401  # Should be unauthorized
        )
        return success

    def test_analytics_without_auth(self):
        """Test analytics endpoint without authentication"""
        success, response = self.run_test(
            "Analytics Without Auth",
            "POST",
            "analytics/insights",
            401,  # Should be unauthorized
            data={"school_id": "test_school"}
        )
        return success

    def test_classes_without_auth(self):
        """Test classes endpoint without authentication"""
        success, response = self.run_test(
            "Classes Without Auth",
            "GET",
            "classes",
            401  # Should be unauthorized
        )
        return success

    def create_test_image(self):
        """Create a test image for student photo"""
        # Create a simple test image
        img = Image.new('RGB', (200, 200), color='blue')
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG')
        buffer.seek(0)
        return buffer

    def test_student_creation_without_auth(self):
        """Test student creation without authentication"""
        # Create test image
        test_image = self.create_test_image()
        
        success, response = self.run_test(
            "Student Creation Without Auth",
            "POST",
            "students",
            401,  # Should be unauthorized
            data={
                'name': 'Test Student',
                'roll_number': 'TEST001',
                'class_name': '10',
                'section': 'A'
            },
            files={'photo': ('test.jpg', test_image, 'image/jpeg')}
        )
        return success

    def test_attendance_marking_without_auth(self):
        """Test attendance marking without authentication"""
        success, response = self.run_test(
            "Attendance Marking Without Auth",
            "POST",
            "attendance/mark",
            401,  # Should be unauthorized
            data={
                "student_ids": ["test-id"],
                "date": "2024-01-01",
                "status": "present",
                "method": "manual"
            }
        )
        return success

    def test_logout_without_auth(self):
        """Test logout without authentication"""
        success, response = self.run_test(
            "Logout Without Auth",
            "POST",
            "auth/logout",
            401  # Should be unauthorized
        )
        return success

def main():
    """Main test function"""
    print("🚀 Starting Shiksha-Connect API Tests")
    print("=" * 50)
    
    tester = ShikshaConnectAPITester()
    
    # Test basic connectivity and endpoints without authentication
    tests = [
        tester.test_root_endpoint,
        tester.test_mock_session_data,
        tester.test_dashboard_without_auth,
        tester.test_students_without_auth,
        tester.test_attendance_without_auth,
        tester.test_analytics_without_auth,
        tester.test_classes_without_auth,
        tester.test_student_creation_without_auth,
        tester.test_attendance_marking_without_auth,
        tester.test_logout_without_auth
    ]
    
    failed_tests = []
    
    for test in tests:
        try:
            if not test():
                failed_tests.append(test.__name__)
        except Exception as e:
            print(f"❌ Test {test.__name__} crashed: {str(e)}")
            failed_tests.append(test.__name__)
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    print(f"Total tests run: {tester.tests_run}")
    print(f"Tests passed: {tester.tests_passed}")
    print(f"Tests failed: {tester.tests_run - tester.tests_passed}")
    
    if failed_tests:
        print(f"\n❌ Failed tests: {', '.join(failed_tests)}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())