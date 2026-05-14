'use client';
import { useState, useEffect, useCallback } from 'react';

interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  is_available: boolean;
  created_at: string;
}

interface Member {
  id: number;
  name: string;
  email: string;
  joined_date: string;
}

interface OverdueLoan {
  book_id: number; // Added book_id for direct access
  loan_id: number;
  book_title: string;
  book_author: string;
  member_name: string;
  member_email: string;
  borrow_date: string;
  due_date: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export default function LibraryDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [overdueLoans, setOverdueLoans] = useState<OverdueLoan[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '' });
  const [newMember, setNewMember] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/books`);
      if (!res.ok) throw new Error('Failed to fetch books');
      const data: Book[] = await res.json();
      setBooks(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data: Member[] = await res.json();
      setMembers(data);
      // Use functional update to check selection state without creating a dependency
      setSelectedMemberId((prev) => (prev === '' && data.length > 0 ? String(data[0].id) : prev));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  const fetchOverdueLoans = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/loans/overdue`);
      if (!res.ok) throw new Error('Failed to fetch overdue loans');
      const data: OverdueLoan[] = await res.json();
      setOverdueLoans(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    setError(null);
    await Promise.all([fetchBooks(), fetchMembers(), fetchOverdueLoans()]);
  }, [fetchBooks, fetchMembers, fetchOverdueLoans]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    loadData();
  }, [refreshData]);

  const handleBorrow = async (bookId: number) => {
    if (!selectedMemberId) {
      alert('Please select a member to borrow the book.');
      return;
    }
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/borrow/${bookId}/${selectedMemberId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to borrow book');
      }
      alert('Book borrowed successfully!');
      await refreshData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error borrowing book: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async (bookId: number) => {
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/return/${bookId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to return book');
      }
      alert('Book returned successfully!');
      await refreshData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error returning book: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/books`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to add book');
      }
      alert('Book added successfully!');
      setNewBook({ title: '', author: '', isbn: '' });
      await refreshData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error adding book: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setProcessing(true);
      const res = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to add member');
      }
      alert('Member added successfully!');
      setNewMember({ name: '', email: '' });
      await refreshData();
    } catch (err) {
      if (err instanceof Error) {
        alert(`Error adding member: ${err.message}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-lg">Loading library data...</div>;
  if (error) return <div className="p-8 text-center text-lg text-red-600">Error: {error}</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto bg-white shadow-lg rounded-lg my-8">
      <h1 className="text-4xl font-extrabold mb-8 text-center text-blue-700">Neighborhood Library Dashboard</h1>

      {/* Member Selector */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg shadow-sm">
        <label htmlFor="member-select" className="block text-lg font-semibold text-blue-800 mb-2">
          Select Member for Operations:
        </label>
        <select
          id="member-select"
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(e.target.value)}
          className="w-full md:w-1/2 p-3 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700"
        >
          <option value="">-- Select a Member --</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} (ID: {member.id})
            </option>
          ))}
        </select>
        {!selectedMemberId && <p className="text-red-500 text-sm mt-2">Please select a member to perform borrow/return actions.</p>}
      </div>

      {/* Add New Book Form */}
      <div className="mb-8 p-6 bg-green-50 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-green-800">Add New Book</h2>
        <form onSubmit={handleAddBook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Title"
            value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
            className="p-3 border border-green-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Author"
            value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
            className="p-3 border border-green-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="ISBN"
            value={newBook.isbn}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })}
            className="p-3 border border-green-300 rounded-md"
            required
          />
          <button 
            type="submit" 
            disabled={processing}
            className="md:col-span-3 bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
          >
            {processing ? 'Adding...' : 'Add Book'}
          </button>
        </form>
      </div>

      {/* Add New Member Form */}
      <div className="mb-8 p-6 bg-purple-50 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-purple-800">Add New Member</h2>
        <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Member Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            className="p-3 border border-purple-300 rounded-md"
            required
          />
          <input
            type="email"
            placeholder="Member Email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            className="p-3 border border-purple-300 rounded-md"
            required
          />
          <button 
            type="submit" 
            disabled={processing}
            className="md:col-span-2 bg-purple-600 text-white p-3 rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
          >
            {processing ? 'Adding...' : 'Add Member'}
          </button>
        </form>
      </div>

      {/* Overdue Books Section */}
      <div className="mb-8 p-6 bg-red-50 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-red-800">Overdue Books ({overdueLoans.length})</h2>
        {overdueLoans.length === 0 ? (
          <p className="text-gray-600">No books are currently overdue. Great job!</p>
        ) : (
          <div className="grid gap-4">
            {overdueLoans.map((loan) => (
              <div key={loan.loan_id} className="border border-red-200 p-4 rounded-md bg-white flex justify-between items-center">
                <div>
                  <p className="font-semibold text-red-700">{loan.book_title} by {loan.book_author}</p>
                  <p className="text-sm text-gray-600">Borrowed by: {loan.member_name} ({loan.member_email})</p>
                  <p className="text-sm text-gray-600">Due: {new Date(loan.due_date).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleReturn(loan.book_id)} // Use book_id directly from the loan object
                  disabled={processing}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-400"
                >
                  {processing ? '...' : 'Mark Returned'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Books Section */}
      <div className="p-6 bg-gray-50 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">All Books ({books.length})</h2>
        <div className="grid gap-4">
          {books.map((book) => (
            <div key={book.id} className="border border-gray-200 p-4 rounded-md bg-white flex justify-between items-center shadow-sm">
              <div>
                <p className="font-semibold">{book.title}</p>
                <p className="text-sm text-gray-600">{book.author} (ISBN: {book.isbn})</p>
              </div>
              {book.is_available ? (
                <button
                  onClick={() => handleBorrow(book.id)}
                  disabled={!selectedMemberId || processing}
                  className={`px-4 py-2 rounded-md transition-colors ${selectedMemberId && !processing ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                >
                  {processing ? '...' : 'Borrow'}
                </button>
              ) : (
                <button
                  onClick={() => handleReturn(book.id)}
                  disabled={processing}
                  className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
                >
                  {processing ? '...' : 'Return'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
