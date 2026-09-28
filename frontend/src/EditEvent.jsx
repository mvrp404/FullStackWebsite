import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/events/${id}`)
      .then(res => {
        const data = res.data;
        if(data.start_datetime) data.start_datetime = data.start_datetime.substring(0, 16);
        if(data.end_datetime) data.end_datetime = data.end_datetime.substring(0, 16);
        setFormData(data);
      })
      .catch(err => alert("Σφάλμα φόρτωσης της εκδήλωσης."));
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/events/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Η εκδήλωση ενημερώθηκε επιτυχώς!");
      navigate('/my-events');
    } catch (err) {
      alert("Σφάλμα κατά την ενημέρωση.");
    }
  };

  if (!formData) return <div className="container mt-4">Φόρτωση...</div>;

  return (
    <div className="container mt-4 mb-5">
      <h3 className="mb-4">✏️ Επεξεργασία Εκδήλωσης</h3>
      <form onSubmit={handleSubmit} className="row g-3 bg-light p-4 rounded shadow-sm">
        
        <div className="col-md-6">
          <label className="form-label">Τίτλος</label>
          <input type="text" name="title" className="form-control" value={formData.title} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Τύπος Εκδήλωσης (Κατηγορία)</label>
          <input type="text" name="event_type" className="form-control" value={formData.event_type} onChange={handleChange} required />
        </div>

        <div className="col-md-6">
          <label className="form-label">Χώρος (Venue)</label>
          <input type="text" name="venue" className="form-control" value={formData.venue} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Διεύθυνση</label>
          <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} required />
        </div>

        <div className="col-md-4">
          <label className="form-label">Πόλη</label>
          <input type="text" name="city" className="form-control" value={formData.city} onChange={handleChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Χώρα</label>
          <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} required />
        </div>
        <div className="col-md-4">
          <label className="form-label">Συνολική Χωρητικότητα</label>
          <input type="number" name="capacity" className="form-control" value={formData.capacity} onChange={handleChange} required />
        </div>

        <div className="col-md-6">
          <label className="form-label">Γεωγραφικό Πλάτος (Latitude)</label>
          <input type="number" step="any" name="latitude" className="form-control" value={formData.latitude || ''} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Γεωγραφικό Μήκος (Longitude)</label>
          <input type="number" step="any" name="longitude" className="form-control" value={formData.longitude || ''} onChange={handleChange} />
        </div>

        <div className="col-md-6">
          <label className="form-label">Έναρξη (Ημερομηνία & Ώρα)</label>
          <input type="datetime-local" name="start_datetime" className="form-control" value={formData.start_datetime} onChange={handleChange} required />
        </div>
        <div className="col-md-6">
          <label className="form-label">Λήξη (Ημερομηνία & Ώρα)</label>
          <input type="datetime-local" name="end_datetime" className="form-control" value={formData.end_datetime} onChange={handleChange} required />
        </div>
        
        <div className="col-12">
          <label className="form-label">URL Φωτογραφίας (Προαιρετικό)</label>
          <input type="text" name="image_url" className="form-control" value={formData.image_url || ''} onChange={handleChange} placeholder="π.χ. https://example.com/photo.jpg" />
        </div>

        {formData.image_url && (
          <div className="col-12 text-center">
            <p className="text-muted small mb-1">Προεπισκόπηση Φωτογραφίας:</p>
            <img src={formData.image_url} alt="Preview" className="img-thumbnail" style={{ maxHeight: '150px', objectFit: 'cover' }} onError={(e)=>{e.target.style.display='none'}} />
          </div>
        )}

        <div className="col-12">
          <label className="form-label">Περιγραφή</label>
          <textarea name="description" className="form-control" rows="3" value={formData.description} onChange={handleChange} required></textarea>
        </div>

        <div className="col-12 mt-4">
          <button type="submit" className="btn btn-success me-2">Αποθήκευση Αλλαγών</button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/my-events')}>Ακύρωση</button>
        </div>
      </form>
    </div>
  );
}

export default EditEvent;