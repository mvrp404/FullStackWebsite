import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MyEvents() {
  const [myEvents, setMyEvents] = useState([]);
  const [eventBookings, setEventBookings] = useState(null); // State για τις κρατήσεις
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = () => {
    axios.get('http://localhost:8000/organizer/events', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setMyEvents(res.data))
    .catch(err => console.error(err));
  };

  const fetchEventBookings = async (eventId, title) => {
    try {
      const res = await axios.get(`http://localhost:8000/events/${eventId}/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEventBookings(res.data);
      setSelectedEventTitle(title);
    } catch (err) {
      alert("Σφάλμα κατά τη φόρτωση των κρατήσεων.");
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm("Είστε σίγουρος/η για τη διαγραφή;")) return;
    try {
      await axios.delete(`http://localhost:8000/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Η εκδήλωση διαγράφηκε!");
      fetchMyEvents();
      setEventBookings(null); // Κλείνουμε τον πίνακα κρατήσεων αν διαγραφεί η εκδήλωση
    } catch (err) {
      alert(err.response?.data?.detail || "Σφάλμα κατά τη διαγραφή.");
    }
  };

  const handleCancel = async (eventId) => {
    if (!window.confirm("Είστε σίγουρος/η για την ακύρωση; Θα σταλεί μήνυμα σε όσους έχουν κάνει κράτηση.")) return;
    try {
      await axios.put(`http://localhost:8000/events/${eventId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Η εκδήλωση ακυρώθηκε επιτυχώς!");
      fetchMyEvents();
    } catch (err) {
      alert(err.response?.data?.detail || "Σφάλμα κατά την ακύρωση.");
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <h3 className="mb-4">Οι Εκδηλώσεις μου (Διοργανωτής)</h3>
      
      {myEvents.length === 0 ? (
        <div className="alert alert-info">Δεν έχετε δημιουργήσει καμία εκδήλωση.</div>
      ) : (
        <div className="table-responsive mb-5">
          <table className="table table-hover border shadow-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>Τίτλος</th>
                <th>Τοποθεσία</th>
                <th>Κατάσταση</th>
                <th>Ενέργειες</th>
              </tr>
            </thead>
            <tbody>
              {myEvents.map(ev => (
                <tr key={ev.id}>
                  <td><strong>{ev.title}</strong></td>
                  <td>{ev.city}</td>
                  <td>
                    {ev.status === "PUBLISHED" ? (
                      <span className="badge bg-success">Δημοσιευμένη</span>
                    ) : (
                      <span className="badge bg-danger">Ακυρωμένη</span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-info me-2 text-white" onClick={() => fetchEventBookings(ev.id, ev.title)}>
                      👀 Κρατήσεις
                    </button>
                    {ev.status !== "CANCELLED" && (
                      <>
                        <Link to={`/edit-event/${ev.id}`} className="btn btn-sm btn-primary me-2">Επεξεργασία</Link>
                        <button className="btn btn-sm btn-outline-danger me-2" onClick={() => handleDelete(ev.id)}>Διαγραφή</button>
                        <button className="btn btn-sm btn-warning" onClick={() => handleCancel(ev.id)}>Ακύρωση</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- ΠΙΝΑΚΑΣ ΚΡΑΤΗΣΕΩΝ ΤΗΣ ΕΠΙΛΕΓΜΕΝΗΣ ΕΚΔΗΛΩΣΗΣ --- */}
      {eventBookings !== null && (
        <div className="card shadow-sm border-primary">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Λίστα Κρατήσεων: {selectedEventTitle}</h5>
            <button className="btn btn-sm btn-light" onClick={() => setEventBookings(null)}>Κλείσιμο X</button>
          </div>
          <div className="card-body">
            {eventBookings.length === 0 ? (
              <p className="text-muted mb-0">Δεν υπάρχουν κρατήσεις για αυτή την εκδήλωση ακόμα.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover">
                  <thead>
                    <tr>
                      <th>ID Κράτησης</th>
                      <th>ID Χρήστη</th>
                      <th>Τύπος Εισιτηρίου</th>
                      <th>Ποσότητα</th>
                      <th>Κόστος</th>
                      <th>Ημερομηνία</th>
                      <th>Κατάσταση</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventBookings.map(b => (
                      <tr key={b.id} className={b.booking_status === 'CANCELLED' ? 'table-danger text-muted' : ''}>
                        <td>#{b.id}</td>
                        <td><strong>{b.user_id}</strong></td>
                        <td><code>{b.ticket_type_id}</code></td>
                        <td>{b.quantity}</td>
                        <td>{b.total_cost}€</td>
                        <td>{b.booking_date ? new Date(b.booking_date).toLocaleString('el-GR') : '-'}</td>
                        <td>
                          {b.booking_status === 'CANCELLED' ? (
                            <span className="badge bg-danger">Ακυρώθηκε</span>
                          ) : (
                            <span className="badge bg-success">Ενεργή</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyEvents;