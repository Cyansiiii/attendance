from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, Request, Response, UploadFile, File, Form
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
# from emergentintegrations.llm.chat import LlmChat, UserMessage
try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    EMERGENT_AVAILABLE = True
except ImportError:
    print("Warning: emergentintegrations not available. AI insights will be disabled.")
    EMERGENT_AVAILABLE = False
    LlmChat = None
    UserMessage = None
import os
import logging
import uuid
import bcrypt
import json
import base64
import cv2
import numpy as np
from PIL import Image
import io
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="Shiksha-Connect API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    role: str  # teacher, administrator, district_officer
    school_id: Optional[str] = None
    district_id: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None
    session_tokens: List[str] = Field(default_factory=list)

class UserCreate(UserBase):
    pass

class StudentBase(BaseModel):
    name: str
    roll_number: str
    class_name: str
    section: str
    date_of_birth: Optional[str] = None
    parent_name: Optional[str] = None
    parent_contact: Optional[str] = None
    school_id: str

class Student(StudentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    photo_url: Optional[str] = None
    facial_embeddings: Optional[List[float]] = None
    enrollment_status: str = "active"

class StudentCreate(StudentBase):
    pass

class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    school_id: str
    class_name: str
    section: str
    date: str  # YYYY-MM-DD format
    status: str  # present, absent, late
    marked_by: str  # teacher user id
    marked_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    method: str  # facial_recognition, manual, rfid
    confidence_score: Optional[float] = None

class AttendanceMarkRequest(BaseModel):
    student_ids: List[str]
    date: str
    status: str
    method: str = "manual"

class AnalyticsRequest(BaseModel):
    school_id: Optional[str] = None
    district_id: Optional[str] = None
    date_range: Optional[Dict[str, str]] = None
    class_filter: Optional[str] = None

class AttendanceReportRequest(BaseModel):
    school_id: Optional[str] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    start_date: Optional[str] = None  # YYYY-MM-DD
    end_date: Optional[str] = None    # YYYY-MM-DD

class AttendanceReportRecord(BaseModel):
    student_id: str
    student_name: str
    roll_number: str
    class_name: str
    section: str
    date: str
    status: str
    marked_by: str
    method: str
    confidence_score: Optional[float] = None

class SessionResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str
    session_token: str

# Authentication helpers
async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from session token"""
    session_token = None
    
    # Check cookie first, then authorization header
    if "session_token" in request.cookies:
        session_token = request.cookies["session_token"]
    elif credentials:
        session_token = credentials.credentials
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Find user by session token
    user_data = await db.users.find_one({"session_tokens": session_token})
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    return User(**user_data)

# Image processing helpers
def process_student_photo(image_data: bytes) -> Dict[str, Any]:
    """Process student photo for facial recognition"""
    try:
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_data))
        
        # Resize and standardize
        image = image.convert('RGB')
        image = image.resize((512, 512), Image.Resampling.LANCZOS)
        
        # Convert to OpenCV format for face detection
        cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        
        # Simple face detection (in production, use advanced ML models)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(cv_image, 1.1, 4)
        
        if len(faces) == 0:
            return {"success": False, "error": "No face detected"}
        
        if len(faces) > 1:
            return {"success": False, "error": "Multiple faces detected"}
        
        # Generate simple facial embeddings (placeholder - use proper ML model in production)
        x, y, w, h = faces[0]
        face_roi = cv_image[y:y+h, x:x+w]
        embeddings = np.random.rand(128).tolist()  # Placeholder embeddings
        
        # Convert back to PIL and save as base64
        processed_image = Image.fromarray(cv2.cvtColor(cv_image, cv2.COLOR_BGR2RGB))
        buffer = io.BytesIO()
        processed_image.save(buffer, format='JPEG', quality=85)
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        return {
            "success": True,
            "image_base64": image_base64,
            "embeddings": embeddings,
            "face_coordinates": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

# AI Analytics helper
async def generate_ai_insights(data: Dict[str, Any]) -> str:
    """Generate AI-powered insights using Emergent LLM"""
    if not EMERGENT_AVAILABLE:
        return "AI insights are currently unavailable. The emergentintegrations package is not installed."
    
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"analytics_{uuid.uuid4()}",
            system_message="You are an AI education analyst. Analyze attendance data and provide actionable insights for school administrators."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(
            text=f"Analyze this school attendance data and provide insights: {json.dumps(data, default=str)}"
        )
        
        response = await chat.send_message(user_message)
        return response
        
    except Exception as e:
        return f"Unable to generate AI insights: {str(e)}"

# Auth Routes
@api_router.get("/auth/session-data")
async def get_session_data(request: Request):
    """Get session data from Emergent Auth"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    try:
        # Call Emergent Auth API
        import aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
                headers={"X-Session-ID": session_id}
            ) as response:
                if response.status != 200:
                    raise HTTPException(status_code=401, detail="Invalid session")
                
                data = await response.json()
                
                # Check if user exists, create if not
                user_data = await db.users.find_one({"email": data["email"]})
                if not user_data:
                    # Create new user
                    new_user = User(
                        email=data["email"],
                        name=data["name"],
                        role="teacher",  # Default role
                        session_tokens=[data["session_token"]]
                    )
                    await db.users.insert_one(new_user.dict())
                    user_data = new_user.dict()
                else:
                    # Update session tokens
                    tokens = user_data.get("session_tokens", [])
                    if data["session_token"] not in tokens:
                        tokens.append(data["session_token"])
                        await db.users.update_one(
                            {"email": data["email"]},
                            {"$set": {"session_tokens": tokens, "last_login": datetime.now(timezone.utc)}}
                        )
                
                return {
                    "id": data["id"],
                    "email": data["email"], 
                    "name": data["name"],
                    "picture": data["picture"],
                    "session_token": data["session_token"],
                    "role": user_data.get("role", "teacher")
                }
                
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/logout")
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        # Remove session token from user
        await db.users.update_one(
            {"id": current_user.id},
            {"$pull": {"session_tokens": session_token}}
        )
    
    return {"message": "Logged out successfully"}

# Student Management Routes
@api_router.post("/students", response_model=Student)
async def create_student(
    name: str = Form(...),
    roll_number: str = Form(...),
    class_name: str = Form(...),
    section: str = Form(...),
    date_of_birth: str = Form(None),
    parent_name: str = Form(None),
    parent_contact: str = Form(None),
    photo: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    """Create new student with photo processing"""
    
    # Check if student already exists
    existing = await db.students.find_one({
        "roll_number": roll_number,
        "class_name": class_name,
        "section": section,
        "school_id": current_user.school_id or "default_school"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Student with this roll number already exists")
    
    student_data = {
        "name": name,
        "roll_number": roll_number,
        "class_name": class_name,
        "section": section,
        "date_of_birth": date_of_birth,
        "parent_name": parent_name,
        "parent_contact": parent_contact,
        "school_id": current_user.school_id or "default_school"
    }
    
    # Process photo if provided
    if photo:
        photo_data = await photo.read()
        processed = process_student_photo(photo_data)
        
        if processed["success"]:
            student_data["photo_url"] = f"data:image/jpeg;base64,{processed['image_base64']}"
            student_data["facial_embeddings"] = processed["embeddings"]
        else:
            raise HTTPException(status_code=400, detail=processed["error"])
    
    student = Student(**student_data)
    await db.students.insert_one(student.dict())
    
    return student

@api_router.get("/students", response_model=List[Student])
async def get_students(
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all students for current user's school"""
    query = {"school_id": current_user.school_id or "default_school"}
    
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    
    students = await db.students.find(query).to_list(1000)
    return [Student(**student) for student in students]

@api_router.get("/students/{student_id}", response_model=Student)
async def get_student(student_id: str, current_user: User = Depends(get_current_user)):
    """Get specific student"""
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    return Student(**student)

# Attendance Routes
@api_router.post("/attendance/mark")
async def mark_attendance(
    request: AttendanceMarkRequest,
    current_user: User = Depends(get_current_user)
):
    """Mark attendance for multiple students"""
    attendance_records = []
    
    for student_id in request.student_ids:
        # Check if already marked for today
        existing = await db.attendance.find_one({
            "student_id": student_id,
            "date": request.date
        })
        
        if existing:
            # Update existing record
            await db.attendance.update_one(
                {"student_id": student_id, "date": request.date},
                {"$set": {
                    "status": request.status,
                    "marked_by": current_user.id,
                    "marked_at": datetime.now(timezone.utc),
                    "method": request.method
                }}
            )
        else:
            # Create new record
            attendance = AttendanceRecord(
                student_id=student_id,
                school_id=current_user.school_id or "default_school",
                class_name="",  # Will be filled from student data
                section="",
                date=request.date,
                status=request.status,
                marked_by=current_user.id,
                method=request.method
            )
            
            # Get student info
            student = await db.students.find_one({"id": student_id})
            if student:
                attendance.class_name = student["class_name"]
                attendance.section = student["section"]
            
            await db.attendance.insert_one(attendance.dict())
            attendance_records.append(attendance)
    
    return {"message": f"Attendance marked for {len(request.student_ids)} students", "records": len(attendance_records)}

@api_router.get("/attendance")
async def get_attendance(
    date: str,
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get attendance records for a specific date"""
    query = {
        "school_id": current_user.school_id or "default_school",
        "date": date
    }
    
    if class_name:
        query["class_name"] = class_name
    if section:
        query["section"] = section
    
    records = await db.attendance.find(query).to_list(1000)
    
    # Enrich with student data
    enriched_records = []
    for record in records:
        student = await db.students.find_one({"id": record["student_id"]})
        if student:
            record["student_name"] = student["name"]
            record["roll_number"] = student["roll_number"]
        enriched_records.append(record)
    
    return enriched_records

@api_router.post("/reports/attendance", response_model=List[AttendanceReportRecord])
async def generate_attendance_report(
    request: AttendanceReportRequest,
    current_user: User = Depends(get_current_user)
):
    """Generate detailed attendance report based on filters"""
    
    query = {"school_id": current_user.school_id or "default_school"}
    
    if request.class_name:
        query["class_name"] = request.class_name
    if request.section:
        query["section"] = request.section
    
    if request.start_date and request.end_date:
        query["date"] = {"$gte": request.start_date, "$lte": request.end_date}
    elif request.start_date:
        query["date"] = {"$gte": request.start_date}
    elif request.end_date:
        query["date"] = {"$lte": request.end_date}

    attendance_records = await db.attendance.find(query).to_list(10000)
    
    # Enrich with student data
    enriched_records = []
    for record in attendance_records:
        student = await db.students.find_one({"id": record["student_id"]})
        if student:
            enriched_records.append(AttendanceReportRecord(
                student_id=record["student_id"],
                student_name=student["name"],
                roll_number=student["roll_number"],
                class_name=record["class_name"],
                section=record["section"],
                date=record["date"],
                status=record["status"],
                marked_by=record["marked_by"],
                method=record["method"],
                confidence_score=record.get("confidence_score")
            ))
    
    return enriched_records

# Analytics Routes
@api_router.post("/analytics/insights")
async def get_analytics_insights(
    request: AnalyticsRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered analytics insights"""
    
    # Build query based on user role and request
    base_query = {}
    
    if current_user.role == "teacher":
        base_query["school_id"] = current_user.school_id or "default_school"
    elif current_user.role == "administrator":
        base_query["school_id"] = request.school_id or current_user.school_id or "default_school"
    elif current_user.role == "district_officer":
        if request.district_id:
            # In a real system, we'd filter by district
            pass
    
    # Date range filter
    if request.date_range:
        start_date = request.date_range.get("start")
        end_date = request.date_range.get("end")
        if start_date and end_date:
            base_query["date"] = {"$gte": start_date, "$lte": end_date}
    
    # Get attendance data
    attendance_records = await db.attendance.find(base_query).to_list(10000)
    
    # Get student data
    students = await db.students.find({"school_id": base_query.get("school_id", "default_school")}).to_list(1000)
    
    # Prepare analytics data
    analytics_data = {
        "total_students": len(students),
        "total_attendance_records": len(attendance_records),
        "attendance_by_status": {},
        "attendance_by_class": {},
        "recent_trends": []
    }
    
    # Calculate statistics
    status_counts = {}
    class_counts = {}
    
    for record in attendance_records:
        status = record.get("status", "unknown")
        class_name = record.get("class_name", "unknown")
        
        status_counts[status] = status_counts.get(status, 0) + 1
        class_counts[class_name] = class_counts.get(class_name, 0) + 1
    
    analytics_data["attendance_by_status"] = status_counts
    analytics_data["attendance_by_class"] = class_counts
    
    # Generate AI insights
    ai_insights = await generate_ai_insights(analytics_data)
    
    return {
        "analytics": analytics_data,
        "ai_insights": ai_insights,
        "generated_at": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/analytics/dashboard")
async def get_dashboard_data(current_user: User = Depends(get_current_user)):
    """Get dashboard data based on user role"""
    
    school_id = current_user.school_id or "default_school"
    
    # Get basic counts
    total_students = await db.students.count_documents({"school_id": school_id})
    
    # Get today's attendance
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_attendance = await db.attendance.find({"school_id": school_id, "date": today}).to_list(1000)
    
    present_count = len([r for r in today_attendance if r.get("status") == "present"])
    absent_count = len([r for r in today_attendance if r.get("status") == "absent"])
    
    # Get recent trends (last 7 days)
    trends = []
    for i in range(7):
        date = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        day_attendance = await db.attendance.find({"school_id": school_id, "date": date}).to_list(1000)
        day_present = len([r for r in day_attendance if r.get("status") == "present"])
        trends.append({"date": date, "present": day_present, "total": len(day_attendance)})
    
    return {
        "total_students": total_students,
        "today_present": present_count,
        "today_absent": absent_count,
        "attendance_rate": (present_count / max(present_count + absent_count, 1)) * 100,
        "trends": list(reversed(trends)),
        "user_role": current_user.role
    }

# Classes and sections helper
@api_router.get("/classes")
async def get_classes(current_user: User = Depends(get_current_user)):
    """Get all classes in the school"""
    school_id = current_user.school_id or "default_school"
    
    # Get unique classes and sections
    pipeline = [
        {"$match": {"school_id": school_id}},
        {"$group": {
            "_id": {"class_name": "$class_name", "section": "$section"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.class_name": 1, "_id.section": 1}}
    ]
    
    results = await db.students.aggregate(pipeline).to_list(1000)
    
    classes = {}
    for result in results:
        class_name = result["_id"]["class_name"]
        section = result["_id"]["section"]
        
        if class_name not in classes:
            classes[class_name] = []
        
        classes[class_name].append({
            "section": section,
            "student_count": result["count"]
        })
    
    return classes

# Include router
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Shiksha-Connect API is running"}