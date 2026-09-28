{/* Έλεγχος αν η εκδήλωση έχει συντεταγμένες */}
{event.latitude && event.longitude ? (
  <div className="mt-4">
    <h5>📍 Τοποθεσία Εκδήλωσης στον Χάρτη</h5>
    <div className="ratio ratio-16x9 shadow-sm rounded border">
      <iframe
        title="OpenStreetMap"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude - 0.01},${event.latitude - 0.01},${event.longitude + 0.01},${event.latitude + 0.01}&layer=mapnik&marker=${event.latitude},${event.longitude}`}
        style={{ border: 0 }}
        allowFullScreen
      ></iframe>
    </div>
    <div className="text-center mt-2">
      <a 
        href={`https://www.openstreetmap.org/?mlat=${event.latitude}&mlon=${event.longitude}#map=16/${event.latitude}/${event.longitude}`} 
        target="_blank" 
        rel="noopener noreferrer"
        className="btn btn-sm btn-outline-secondary"
      >
        Προβολή σε μεγαλύτερο χάρτη
      </a>
    </div>
  </div>
) : (
  <p className="text-muted mt-3">Δεν έχουν οριστεί γεωγραφικές συντεταγμένες για αυτήν την εκδήλωση.</p>
)}