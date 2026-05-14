from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import models, schemas, database

# --- App Setup ---
app = FastAPI(
    title="Neighborhood Library API",
    description="API for managing books, members, and lending operations in a small neighborhood library.",
    version="1.0.0"
)

# CORS Middleware to allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get a database session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to the Neighborhood Library API!"}

@app.post("/books", response_model=schemas.Book, status_code=status.HTTP_201_CREATED)
def add_book(book: schemas.BookCreate, db: Session = Depends(get_db)):
    """
    Add a new book to the library.
    """
    db_book = models.Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@app.get("/books", response_model=List[schemas.Book])
def get_all_books(db: Session = Depends(get_db)):
    """
    Retrieve a list of all books in the library.
    """
    return db.query(models.Book).all()

@app.post("/members", response_model=schemas.Member, status_code=status.HTTP_201_CREATED)
def add_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    """
    Register a new library member.
    """
    db_member = models.Member(**member.model_dump())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@app.get("/members", response_model=List[schemas.Member])
def get_all_members(db: Session = Depends(get_db)):
    """
    Retrieve a list of all members in the library.
    """
    return db.query(models.Member).all()

@app.post("/borrow/{book_id}/{member_id}", response_model=schemas.LoanResponse)
def borrow_book(book_id: int, member_id: int, db: Session = Depends(get_db)):
    """
    Record when a member borrows a book.
    """
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    if not book.is_available:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Book is currently not available")
    
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Set due date 14 days from now
    due_date = datetime.now(timezone.utc) + timedelta(days=14)

    new_loan = models.Loan(
        book_id=book_id, 
        member_id=member_id, 
        due_date=due_date
    )
    book.is_available = False # Mark book as unavailable
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    return {"message": "Book borrowed successfully", "loan_id": new_loan.id, "due_date": new_loan.due_date}

@app.post("/return/{book_id}", response_model=schemas.LoanResponse)
def return_book(book_id: int, db: Session = Depends(get_db)):
    """
    Record when a borrowed book is returned.
    """
    # Find the active loan for this book
    loan = db.query(models.Loan).filter(
        models.Loan.book_id == book_id, 
        models.Loan.return_date == None
    ).first()

    if not loan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active loan found for this book")
    
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book: # Should not happen if loan exists, but good for safety
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")

    book.is_available = True # Mark book as available
    loan.return_date = datetime.now(timezone.utc) # Set return date
    db.commit()
    db.refresh(loan)
    return {"message": "Book returned successfully", "loan_id": loan.id, "return_date": loan.return_date}

@app.get("/members/{member_id}/loans", response_model=List[schemas.Book])
def get_member_loans(member_id: int, db: Session = Depends(get_db)):
    """
    Query all books a certain member currently has borrowed.
    """
    member = db.query(models.Member).filter(models.Member.id == member_id).first()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Join Loan and Book tables to get book details for active loans
    active_loans = db.query(models.Book).join(models.Loan).filter(
        models.Loan.member_id == member_id, 
        models.Loan.return_date == None
    ).all()
    
    return active_loans

@app.get("/loans/overdue", response_model=List[schemas.OverdueLoan])
def get_overdue_loans(db: Session = Depends(get_db)):
    """
    List all currently overdue books.
    """
    overdue_loans = db.query(models.Loan, models.Book, models.Member).join(models.Book).join(models.Member).filter(
        models.Loan.return_date == None,
        models.Loan.due_date < datetime.now(timezone.utc)
    ).all()

    result = []
    for loan, book, member in overdue_loans:
        result.append(schemas.OverdueLoan(
            book_id=book.id, # Add book_id here for direct access in frontend
            loan_id=loan.id,
            book_title=book.title,
            book_author=book.author,
            member_name=member.name,
            member_email=member.email,
            borrow_date=loan.borrow_date,
            due_date=loan.due_date
        ))
    return result
