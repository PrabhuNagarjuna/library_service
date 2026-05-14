from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import List, Optional

# --- Book Schemas ---
class BookBase(BaseModel):
    title: str
    author: str
    isbn: str

class BookCreate(BookBase):
    pass

class Book(BookBase):
    id: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True # For SQLAlchemy ORM compatibility

# --- Member Schemas ---
class MemberBase(BaseModel):
    name: str
    email: EmailStr

class MemberCreate(MemberBase):
    pass

class Member(MemberBase):
    id: int
    joined_date: datetime

    class Config:
        from_attributes = True

# --- Loan Schemas ---
class LoanResponse(BaseModel):
    message: str
    loan_id: Optional[int] = None
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None

class OverdueLoan(BaseModel):
    loan_id: int
    book_title: str
    book_author: str
    member_name: str
    member_email: EmailStr
    borrow_date: datetime
    due_date: datetime

    class Config:
        from_attributes = True
