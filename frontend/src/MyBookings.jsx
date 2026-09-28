import { useState, useEffect } from 'react'
import axios from 'axios'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:8000/bookings/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        console.log("Bookings data apo backend:", res.data)
        setBookings(res.data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Sfalma:", err)
        setLoading(false)
      })
    }
  }, [token])

  if (!token) return <div className="container mt-5 alert alert-warning">Parakalo syndetheite gia na deite tis kratiseis sas.</div>

  return (
    <div className="container mt-4">
      <h3 className="mb-4">🎟️ Οι Κρατήσεις μου</h3>
      {loading ? (
        <p>Φόρτωση...</p>
      ) : bookings.length === 0 ? (
        <div className="alert alert-info">Δεν έχετε πραγματοποιήσει ακόμα κάποια κράτηση.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover mt-3 shadow-sm border">
            <thead className="table-dark">
              <tr>
                <th>ID Κράτησης</th>
                <th>ID Εισιτηρίου</th>
                <th>Ποσότητα</th>
                <th>Ημερομηνία</th>
                <th>Κατάσταση</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(b => {
                const rawDate = b.booking_date || b.created_at || b.date || b.timestamp;
                const formattedDate = rawDate ? new Date(rawDate).toLocaleString('el-GR') : 'Μη διαθέσιμη ημερομηνία';
                const isCancelled = b.booking_status === 'CANCELLED';

                return (
                  <tr key={b.id} className={isCancelled ? 'table-danger text-muted' : ''}>
                    <td><span className="badge bg-secondary">#{b.id}</span></td>
                    <td><code>{b.ticket_type_id}</code></td>
                    <td>{b.quantity}</td>
                    <td>{formattedDate}</td>
                    <td>
                      {isCancelled ? (
                        <span className="badge bg-danger">Ακυρώθηκε</span>
                      ) : (
                        <span className="badge bg-success">Επιβεβαιωμένη</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default MyBookings