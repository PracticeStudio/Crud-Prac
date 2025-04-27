import { useState, useEffect } from 'react';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

export default function App() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!/^\d+$/.test(form.phone)) newErrors.phone = 'Phone must contain only numbers';
    if (!form.email.includes('@')) newErrors.email = 'Email must contain @';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setForm({...form, phone: value});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', editingId), form);
      } else {
        await addDoc(collection(db, 'users'), form);
      }
      setForm({ name: '', phone: '', email: '' });
      setEditingId(null);
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) {
      setLoading(true);
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(user => user.id !== id));
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">User Management (Firebase)</h1>
      
      <form className="user-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            name="name"
            value={form.name}
            onChange={(e) => setForm({...form, name: e.target.value})}
            placeholder="Name"
            disabled={loading}
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>
        
        <div className="form-group">
          <input
            name="phone"
            value={form.phone}
            onChange={handlePhoneChange}
            placeholder="Phone (numbers only)"
            disabled={loading}
          />
          {errors.phone && <span className="error">{errors.phone}</span>}
        </div>
        
        <div className="form-group">
          <input
            name="email"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            placeholder="Email (must contain @)"
            type="email"
            disabled={loading}
          />
          {errors.email && <span className="error">{errors.email}</span>}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => setEditingId(null)}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="user-list">
        {loading && !users.length ? (
          <div className="loading">Loading users...</div>
        ) : (
          users.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.phone}</p>
                <p>{user.email}</p>
              </div>
              <div className="user-actions">
                <button 
                  className="edit-btn"
                  onClick={() => { 
                    setForm(user); 
                    setEditingId(user.id); 
                  }}
                  disabled={loading}
                >
                  Edit
                </button>
                <button 
                  className="delete-btn"
                  onClick={() => handleDelete(user.id)}
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
