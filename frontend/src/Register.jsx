import React, { useState } from 'react';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    password_confirm: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    latitude: 0.0,
    longitude: 0.0,
    afm: '',
    role: 'ADMIN'
  });
  
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          latitude: parseFloat(formData.latitude) || 0.0,
          longitude: parseFloat(formData.longitude) || 0.0
        })
      });

      if (response.ok) {
        setMessage('Η εγγραφή ολοκληρώθηκε επιτυχώς! Μπορείτε να κάνετε Login.');
      } else {
        const text = await response.text();
        try {
          const errorData = JSON.parse(text);
          setMessage(`Σφάλμα Server: ${errorData.detail}`);
        } catch {
          setMessage(`Σφάλμα Server (μη αναμενόμενο): ${text}`);
        }
      }
    } catch (error) {
      setMessage(`Σφάλμα Επικοινωνίας: ${error.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Εγγραφή Χρήστη</h2>
      {message && <p style={{ fontWeight: 'bold', color: 'red' }}>{message}</p>}
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Username</label><br/>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Κωδικός</label><br/>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Επιβεβαίωση Κωδικού</label><br/>
          <input type="password" name="password_confirm" value={formData.password_confirm} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Email</label><br/>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Όνομα</label><br/>
          <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Επώνυμο</label><br/>
          <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Τηλέφωνο</label><br/>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Διεύθυνση</label><br/>
          <input type="text" name="address" value={formData.address} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Γεωγραφικό Πλάτος (Latitude)</label><br/>
          <input type="number" step="any" name="latitude" value={formData.latitude} onChange={handleChange} style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Γεωγραφικό Μήκος (Longitude)</label><br/>
          <input type="number" step="any" name="longitude" value={formData.longitude} onChange={handleChange} style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>ΑΦΜ</label><br/>
          <input type="text" name="afm" value={formData.afm} onChange={handleChange} required style={{ width: '100%' }}/>
        </div>
        
        <div>
          <label>Ρόλος</label><br/>
          <select name="role" value={formData.role} onChange={handleChange} style={{ width: '100%', padding: '5px' }}>
            <option value="GUEST">Συμμετέχων</option>
            <option value="ORGANIZER">Διοργανωτής</option>
            <option value="ADMIN">Διαχειριστής</option>
          </select>
        </div>
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
          Ολοκλήρωση Εγγραφής
        </button>
      </form>
    </div>
  );
};

export default Register;