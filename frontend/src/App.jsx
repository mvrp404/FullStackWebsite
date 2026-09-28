import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import Register from './Register';
import Admin from './Admin';
import Messages from './Messages';
import MyBookings from './MyBookings';
import CreateEvent from './CreateEvent';
import MyEvents from './MyEvents';
import EditEvent from './EditEvent';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [events, setEvents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showMap, setShowMap] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  // --- States για Φίλτρα ---
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // --- States για Σελιδοποίηση ---
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 6;

  useEffect(() => {
    fetchData();
    if (token) {
      fetchRecommendations();
      axios.get('http://localhost:8000/messages/unread-count', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setUnreadCount(res.data.unread))
        .catch(err => console.error(err));
    }
  }, [token]);

  const fetchData = () => {
    axios.get('http://localhost:8000/events/')
      .then(res => setEvents(res.data))
      .catch(err => console.error(err));
  };

  const fetchRecommendations = () => {
    axios.get('http://localhost:8000/recommendations/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setRecommendations(res.data))
    .catch(err => console.error("Σφάλμα συστάσεων:", err));
  };

  const handleBooking = async (ticketTypeId) => {
    try {
      await axios.post('http://localhost:8000/bookings/', 
        { ticket_type_id: ticketTypeId, quantity: 1 }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Η κράτηση ολοκληρώθηκε επιτυχώς!");
      fetchData(); 
      if (token) fetchRecommendations(); 
    } catch (err) {
      alert("Σφάλμα κατά την κράτηση. Ίσως εξαντλήθηκαν τα εισιτήρια ή δεν έχετε δικαίωμα.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    setRecommendations([]);
  };

  const toggleMap = (eventId) => {
    setShowMap(prev => ({ ...prev, [eventId]: !prev[eventId] }));
  };

  // --- Λογική Φιλτραρίσματος ---
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === '' || (event.event_type && event.event_type.toLowerCase().includes(category.toLowerCase()));
    const matchesLocation = location === '' || (event.city && event.city.toLowerCase().includes(location.toLowerCase()));
    
    const evStart = new Date(event.start_datetime);
    const matchesStart = startDate === '' || evStart >= new Date(startDate);
    const matchesEnd = endDate === '' || evStart <= new Date(endDate);

    let matchesPrice = true;
    if (maxPrice !== '') {
      if (!event.ticket_types || event.ticket_types.length === 0) {
        matchesPrice = false;
      } else {
        matchesPrice = event.ticket_types.some(t => t.price <= parseFloat(maxPrice));
      }
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesStart && matchesEnd && matchesPrice;
  });

  // --- Λογική Σελιδοποίησης ---
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(indexOfFirstEvent, indexOfLastEvent);
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const renderEventCards = (eventList) => {
    return eventList.map(event => (
      <div key={event.id} className="col-md-6 col-lg-4 mb-4">
        <div className="card h-100 shadow-sm border-0">
          {event.image_url && (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="card-img-top" 
              style={{ height: '180px', objectFit: 'cover' }} 
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          )}
          <div className="card-body">
            <h5 className="card-title fw-bold">{event.title}</h5>
            <p className="text-muted small">📍 {event.venue}, {event.city}</p>
            <p className="card-text text-secondary">{event.description}</p>
            <p className="small mb-1"><strong>Χωρητικότητα:</strong> {event.capacity}</p>
            
            {event.latitude && event.longitude ? (
              <div className="mt-3 mb-3">
                <button 
                  className="btn btn-sm btn-outline-primary mb-2"
                  onClick={() => toggleMap(event.id)}
                >
                  {showMap[event.id] ? "📍 Απόκρυψη Χάρτη" : "📍 Προβολή στον Χάρτη"}
                </button>
                {showMap[event.id] && (
                  <div className="ratio ratio-16x9 shadow-sm rounded border mt-2">
                    <iframe
                      title={`map-${event.id}`}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.01},${event.latitude - 0.01},${event.longitude + 0.01},${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
                      style={{ border: 0 }}
                      allowFullScreen
                    ></iframe>
                  </div>
                )}
              </div>
            ) : (
              <p className="small text-muted fst-italic">Δεν έχουν οριστεί συντεταγμένες.</p>
            )}

            <div className="mt-3">
              <h6>Εισιτήρια:</h6>
              {event.ticket_types && event.ticket_types.length > 0 ? (
                event.ticket_types.map(ticket => (
                  <div key={ticket.id} className="p-2 border rounded mb-2 d-flex justify-content-between align-items-center bg-light">
                    <div>
                      <strong>{ticket.name}</strong> - {ticket.price}€
                      <br/><small className="text-success">Διαθέσιμα: {ticket.available}</small>
                    </div>
                    <button 
                      className="btn btn-sm btn-success" 
                      disabled={!token || ticket.available <= 0}
                      onClick={() => handleBooking(ticket.id)}
                    >
                      {token ? "Κράτηση" : "Σύνδεση"}
                    </button>
                  </div>
                ))
              ) : (
                <p className="small text-danger">Δεν υπάρχουν διαθέσιμοι τύποι εισιτηρίων.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark px-3 mb-4 shadow">
        <Link className="navbar-brand fw-bold" to="/">📅 Event Management</Link>
        <div className="navbar-nav ms-auto align-items-center">
          {token ? (
            <>
              {role === 'ADMIN' && <Link className="nav-link" to="/admin">Admin Panel</Link>}
              {role === 'ORGANIZER' && <Link className="nav-link" to="/create-event">Δημιουργία Εκδήλωσης</Link>}
              {role === 'ORGANIZER' && <Link className="nav-link text-warning" to="/my-events">Οι Εκδηλώσεις Μου</Link>}
              <Link className="nav-link position-relative" to="/messages">
                Μηνύματα
                {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}
              </Link>
              <Link className="nav-link" to="/bookings">Κρατήσεις μου</Link>
              <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>Αποσύνδεση</button>
            </>
          ) : (
            <>
              <Link className="nav-link" to="/login">Σύνδεση</Link>
              <Link className="nav-link" to="/register">Εγγραφή</Link>
            </>
          )}
        </div>
      </nav>

      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={<Login setToken={setToken} setRole={setRole} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={token && role === 'ADMIN' ? <Admin /> : <Navigate to="/login" />} />
          <Route path="/messages" element={token ? <Messages /> : <Navigate to="/login" />} />
          <Route path="/bookings" element={token ? <MyBookings /> : <Navigate to="/login" />} />
          <Route path="/create-event" element={token && (role === 'ORGANIZER' || role === 'ADMIN') ? <CreateEvent token={token} /> : <Navigate to="/login" />} />
          <Route path="/my-events" element={token && role === 'ORGANIZER' ? <MyEvents /> : <Navigate to="/login" />} />
          <Route path="/edit-event/:id" element={token && role === 'ORGANIZER' ? <EditEvent /> : <Navigate to="/login" />} />
          
          <Route path="/" element={
            <div className="container">
              {/* --- ΣΥΣΤΗΜΑ ΣΥΣΤΑΣΕΩΝ --- */}
              {token && recommendations.length > 0 && (
                <div className="mb-5 p-4 bg-light rounded shadow-sm border-start border-primary border-4">
                  <h3 className="mb-4 text-primary">✨ Προτεινόμενες Εκδηλώσεις για Εσάς</h3>
                  <div className="row">
                    {renderEventCards(recommendations.slice(0, 3))}
                  </div>
                </div>
              )}

              {/* --- ΦΙΛΤΡΑ ΑΝΑΖΗΤΗΣΗΣ --- */}
              <div className="card shadow-sm mb-4">
                <div className="card-body">
                  <h5 className="mb-3">🔍 Αναζήτηση & Φίλτρα</h5>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <input type="text" className="form-control" placeholder="Αναζήτηση σε τίτλο/περιγραφή..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <div className="col-md-2">
                      <input type="text" className="form-control" placeholder="Κατηγορία (π.χ. Συναυλία)" value={category} onChange={(e) => {setCategory(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <div className="col-md-2">
                      <input type="text" className="form-control" placeholder="Τοποθεσία (π.χ. Αθήνα)" value={location} onChange={(e) => {setLocation(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <div className="col-md-2">
                      <input type="number" className="form-control" placeholder="Max Τιμή (€)" value={maxPrice} onChange={(e) => {setMaxPrice(e.target.value); setCurrentPage(1);}} />
                    </div>
                  </div>
                  <div className="row g-2 mt-2">
                    <div className="col-md-3">
                      <label className="small text-muted">Από Ημερομηνία</label>
                      <input type="date" className="form-control" value={startDate} onChange={(e) => {setStartDate(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <div className="col-md-3">
                      <label className="small text-muted">Έως Ημερομηνία</label>
                      <input type="date" className="form-control" value={endDate} onChange={(e) => {setEndDate(e.target.value); setCurrentPage(1);}} />
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <button className="btn btn-secondary" onClick={() => {
                        setSearchTerm(''); setCategory(''); setLocation(''); setStartDate(''); setEndDate(''); setMaxPrice(''); setCurrentPage(1);
                      }}>Καθαρισμός Φίλτρων</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- ΟΛΕΣ ΟΙ ΕΚΔΗΛΩΣΕΙΣ ΜΕ ΣΕΛΙΔΟΠΟΙΗΣΗ --- */}
              <h3 className="mb-4">Διαθέσιμες Εκδηλώσεις</h3>
              <div className="row">
                {currentEvents.length === 0 ? (
                  <p className="text-muted">Δεν βρέθηκαν εκδηλώσεις που να ταιριάζουν στα κριτήρια.</p>
                ) : (
                  renderEventCards(currentEvents)
                )}
              </div>

              {/* --- CONTROLS ΣΕΛΙΔΟΠΟΙΗΣΗΣ --- */}
              {totalPages > 1 && (
                <nav className="mt-4">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage - 1)}>Προηγούμενη</button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button className="page-link" onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button className="page-link" onClick={() => setCurrentPage(currentPage + 1)}>Επόμενη</button>
                    </li>
                  </ul>
                </nav>
              )}

            </div>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;