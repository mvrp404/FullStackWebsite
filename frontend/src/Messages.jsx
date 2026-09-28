import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Messages() {
  const [inbox, setInbox] = useState([]);
  const [sent, setSent] = useState([]);
  const [activeTab, setActiveTab] = useState('inbox');
  
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const fetchMessages = async () => {
    try {
      const resInbox = await axios.get('http://localhost:8000/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
      setInbox(resInbox.data);
      
      const resSent = await axios.get('http://localhost:8000/messages/sent', { headers: { Authorization: `Bearer ${token}` } });
      setSent(resSent.data);
      
      setLoading(false);
    } catch (err) {
      console.error("Σφάλμα κατά τη φόρτωση των μηνυμάτων:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMessages();
  }, [token]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8000/messages/', {
        receiver_id: parseInt(receiverId),
        content: content
      }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Το μήνυμα στάλθηκε επιτυχώς!');
      setReceiverId('');
      setContent('');
      fetchMessages();
    } catch (err) {
      alert('Σφάλμα κατά την αποστολή του μηνύματος. Ελέγξτε το ID του παραλήπτη.');
    }
  };

  const markAsRead = async (msgId) => {
    try {
      await axios.put(`http://localhost:8000/messages/${msgId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      // Ανανέωση μόνο του inbox για να φύγει το "ΝΕΟ"
      const resInbox = await axios.get('http://localhost:8000/messages/inbox', { headers: { Authorization: `Bearer ${token}` } });
      setInbox(resInbox.data);
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το μήνυμα;")) return;
    try {
      await axios.delete(`http://localhost:8000/messages/${msgId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchMessages();
    } catch (err) {
      alert('Σφάλμα κατά τη διαγραφή.');
    }
  };

  if (!token) return <div className="container mt-5 alert alert-warning">Παρακαλώ συνδεθείτε για να δείτε τα μηνύματά σας.</div>;

  const currentMessages = activeTab === 'inbox' ? inbox : sent;

  return (
    <div className="container mt-4">
      <h3 className="mb-4">✉️ Κέντρο Μηνυμάτων</h3>

      {/* Φόρμα Αποστολής Μηνύματος */}
      <div className="card shadow-sm p-4 mb-4">
        <h5 className="mb-3">Αποστολή Νέου Μηνύματος</h5>
        <form onSubmit={handleSendMessage}>
          <div className="row">
            <div className="col-md-3 mb-3">
              <label className="form-label">ID Παραλήπτη</label>
              <input type="number" className="form-control" value={receiverId} onChange={e => setReceiverId(e.target.value)} placeholder="π.χ. 2" required />
            </div>
            <div className="col-md-9 mb-3">
              <label className="form-label">Περιεχόμενο Μηνύματος</label>
              <textarea className="form-control" rows="2" value={content} onChange={e => setContent(e.target.value)} placeholder="Γράψτε το μήνυμά σας εδώ..." required ></textarea>
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Αποστολή Μηνύματος</button>
        </form>
      </div>

      {/* TABS */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'inbox' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('inbox')}>
            📥 Εισερχόμενα
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'sent' ? 'active fw-bold' : ''}`} onClick={() => setActiveTab('sent')}>
            📤 Απεσταλμένα
          </button>
        </li>
      </ul>

      {/* Λίστα Μηνυμάτων */}
      <div className="card shadow-sm p-4">
        {loading ? (
          <p>Φόρτωση μηνυμάτων...</p>
        ) : currentMessages.length === 0 ? (
          <div className="alert alert-info mb-0">Δεν έχετε μηνύματα σε αυτόν τον φάκελο.</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>{activeTab === 'inbox' ? 'Αποστολέας (Sender ID)' : 'Παραλήπτης (Receiver ID)'}</th>
                  <th>Μήνυμα</th>
                  <th>Ημερομηνία / Ώρα</th>
                  <th>Ενέργειες</th>
                </tr>
              </thead>
              <tbody>
                {currentMessages.map(msg => (
                  <tr 
                    key={msg.id} 
                    className={activeTab === 'inbox' && !msg.is_read ? 'table-warning' : ''}
                    onMouseEnter={() => { if(activeTab === 'inbox' && !msg.is_read) markAsRead(msg.id); }}
                  >
                    <td>
                      <span className="badge bg-secondary">#{msg.id}</span>
                      {activeTab === 'inbox' && !msg.is_read && <span className="badge bg-danger ms-2">ΝΕΟ</span>}
                    </td>
                    <td>{activeTab === 'inbox' ? msg.sender_id : msg.receiver_id}</td>
                    <td>{msg.content}</td>
                    <td>{msg.timestamp ? new Date(msg.timestamp).toLocaleString('el-GR') : 'N/A'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteMessage(msg.id)}>
                        Διαγραφή
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Messages;