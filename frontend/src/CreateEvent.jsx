import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function CreateEvent({ token }) {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [venue, setVenue] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Greece');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(''); // ΝΕΟ: Για τη φωτογραφία
  const [startDatetime, setStartDatetime] = useState('');
  const [endDatetime, setEndDatetime] = useState('');

  // Πεδία για τον τύπο εισιτηρίου
  const [ticketId, setTicketId] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketQuantity, setTicketQuantity] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // 1. Δημιουργία Εκδήλωσης
      await axios.post('http://localhost:8000/events/', {
        id,
        title,
        event_type: eventType,
        venue,
        address,
        city,
        country,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        capacity: parseInt(capacity),
        description,
        image_url: imageUrl ? imageUrl : null, // Αποστολή της φωτογραφίας
        start_datetime: new Date(startDatetime).toISOString(),
        end_datetime: new Date(endDatetime).toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Προσθήκη Εισιτηρίου (αν έχουν συμπληρωθεί τα πεδία)
      if (ticketId && ticketName && ticketPrice && ticketQuantity) {
        await axios.post(`http://localhost:8000/events/${id}/tickets`, {
          id: ticketId,
          name: ticketName,
          price: parseFloat(ticketPrice),
          quantity: parseInt(ticketQuantity)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      alert('Η εκδήλωση και το εισιτήριο δημιουργήθηκαν επιτυχώς!');
      navigate('/my-events');
    } catch (err) {
      alert('Σφάλμα κατά τη δημιουργία. Ελέγξτε τα πεδία ή αν το ID υπάρχει ήδη.');
      console.error(err);
    }
  };

  return (
    <div className="row justify-content-center mb-5 mt-4">
      <div className="col-md-8">
        <div className="card shadow p-4">
          <h3 className="mb-3">➕ Δημιουργία Νέας Εκδήλωσης & Εισιτηρίου</h3>
          <form onSubmit={handleSubmit}>
            
            <h5 className="text-secondary mt-2">1. Στοιχεία Εκδήλωσης</h5>
            <div className="mb-3">
              <label className="form-label">ID Εκδήλωσης (π.χ. concert-1)</label>
              <input type="text" className="form-control" value={id} onChange={e => setId(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Τίτλος</label>
              <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Τύπος Εκδήλωσης</label>
              <input type="text" className="form-control" value={eventType} onChange={e => setEventType(e.target.value)} required />
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Χώρος (Venue)</label>
                <input type="text" className="form-control" value={venue} onChange={e => setVenue(e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Διεύθυνση</label>
                <input type="text" className="form-control" value={address} onChange={e => setAddress(e.target.value)} required />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Πόλη</label>
                <input type="text" className="form-control" value={city} onChange={e => setCity(e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Χώρα</label>
                <input type="text" className="form-control" value={country} onChange={e => setCountry(e.target.value)} required />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Latitude</label>
                <input type="number" step="any" className="form-control" value={latitude} onChange={e => setLatitude(e.target.value)} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Longitude</label>
                <input type="number" step="any" className="form-control" value={longitude} onChange={e => setLongitude(e.target.value)} />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Συνολική Χωρητικότητα (Capacity)</label>
              <input type="number" className="form-control" value={capacity} onChange={e => setCapacity(e.target.value)} required />
            </div>
            
            {/* ΝΕΟ: Πεδίο για τη Φωτογραφία */}
            <div className="mb-3">
              <label className="form-label">URL Φωτογραφίας (Προαιρετικό)</label>
              <input type="text" className="form-control" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="π.χ. https://example.com/image.jpg" />
            </div>

            <div className="mb-3">
              <label className="form-label">Περιγραφή</label>
              <textarea className="form-control" rows="3" value={description} onChange={e => setDescription(e.target.value)}></textarea>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Ημ/νία Έναρξης</label>
                <input type="datetime-local" className="form-control" value={startDatetime} onChange={e => setStartDatetime(e.target.value)} required />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ημ/νία Λήξης</label>
                <input type="datetime-local" className="form-control" value={endDatetime} onChange={e => setEndDatetime(e.target.value)} required />
              </div>
            </div>

            <hr className="my-4" />
            <h5 className="text-secondary">2. Τύπος Εισιτηρίου (Προαιρετικό αλλά συνιστάται)</h5>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">ID Εισιτηρίου (π.χ. t1)</label>
                <input type="text" className="form-control" value={ticketId} onChange={e => setTicketId(e.target.value)} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Όνομα Εισιτηρίου (π.χ. VIP / Γενική Είσοδος)</label>
                <input type="text" className="form-control" value={ticketName} onChange={e => setTicketName(e.target.value)} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Τιμή (€)</label>
                <input type="number" step="any" className="form-control" value={ticketPrice} onChange={e => setTicketPrice(e.target.value)} />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Ποσότητα Εισιτηρίων</label>
                <input type="number" className="form-control" value={ticketQuantity} onChange={e => setTicketQuantity(e.target.value)} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-100 mt-3 fw-bold">Δημιουργία Εκδήλωσης & Εισιτηρίου</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default CreateEvent;