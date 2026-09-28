import React, { useEffect, useState } from 'react';
import axios from 'axios';

function Admin() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPendingUsers();
    fetchAllUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/users/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης εκκρεμών:", err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(res.data);
    } catch (err) {
      console.error("Σφάλμα φόρτωσης όλων των χρηστών:", err);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await axios.put(`http://127.0.0.1:8000/admin/users/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Ο χρήστης εγκρίθηκε!');
      fetchPendingUsers();
      fetchAllUsers();
    } catch (err) {
      alert('Σφάλμα έγκρισης.');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να απορρίψετε και να διαγράψετε αυτόν τον χρήστη;")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/admin/users/${userId}/reject`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Η αίτηση του χρήστη απορρίφθηκε.');
      fetchPendingUsers();
      fetchAllUsers();
    } catch (err) {
      alert('Σφάλμα απόρριψης.');
    }
  };

  const downloadFile = (url, filename) => {
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob'
    }).then((res) => {
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Διαχείριση Συστήματος (Admin)</h2>
      
      {/* Κουμπιά Εξαγωγής */}
      <div className="mb-4">
        <button className="btn btn-secondary me-2" onClick={() => downloadFile('http://127.0.0.1:8000/admin/export/json', 'events.json')}>
          Εξαγωγή JSON
        </button>
        <button className="btn btn-dark" onClick={() => downloadFile('http://127.0.0.1:8000/admin/export/xml', 'events.xml')}>
          Εξαγωγή XML (με DTD)
        </button>
      </div>

      {/* Εκκρεμείς Χρήστες */}
      <h4 className="mt-4">Εκκρεμείς Χρήστες προς Έγκριση</h4>
      {pendingUsers.length === 0 ? (
        <p className="text-muted">Δεν υπάρχουν εκκρεμείς χρήστες αυτή τη στιγμή.</p>
      ) : (
        <ul className="list-group mb-4">
          {pendingUsers.map(u => (
            <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span><strong>ID: #{u.id}</strong> | {u.username} ({u.role}) - {u.email}</span>
              <div>
                <button className="btn btn-success btn-sm me-2" onClick={() => handleApprove(u.id)}>Έγκριση</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleReject(u.id)}>Απόρριψη</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Όλοι οι Χρήστες */}
      <h4 className="mt-4">Όλοι οι Χρήστες του Συστήματος</h4>
      {allUsers.length === 0 ? (
        <p className="text-muted">Δεν βρέθηκαν χρήστες.</p>
      ) : (
        <ul className="list-group mb-5">
          {allUsers.map(u => (
            <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
              <span>
                <strong>ID: #{u.id}</strong> | {u.username} ({u.role}) - {u.email}
              </span>
              <span>
                {u.is_approved ? (
                  <span className="badge bg-success">Εγκεκριμένος</span>
                ) : (
                  <span className="badge bg-warning text-dark">Εκκρεμεί</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Admin;