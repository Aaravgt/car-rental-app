export default function Home() {
  return (
    <section style={{ background: 'linear-gradient(90deg,#eef2ff,#fff)', padding: '2rem 1rem', borderRadius: 12, maxWidth: 1100, margin: '1rem auto' }}>
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: '1.75rem', color: '#1f2937' }}>Reliable car rentals — wherever you go</h2>
          <p style={{ color: '#374151', marginTop: '0.5rem' }}>Choose from a wide range of vehicles, add optional GPS or toll passes, and reserve in seconds.</p>
          <ul style={{ marginTop: '0.75rem', color: '#374151', listStyle: 'none', padding: 0 }}>
          <li className="feature-item">
            <img src="/images/icons/check-green.png" alt="" className="feature-icon" />
            <span>Flexible pickup locations</span>
          </li>
          <li className="feature-item">
            <img src="/images/icons/check-green.png" alt="" className="feature-icon" />
            <span>Transparent pricing — no hidden fees</span>
          </li>
          <li className="feature-item">
            <img src="/images/icons/check-green.png" alt="" className="feature-icon" />
            <span>Optional GPS and toll pass for stress-free trips</span>
          </li>
        </ul>

        </div>
        <div style={{ width: 280, textAlign: 'center' }}>
          <img src="/public/images/homepage/car-rental-clipart.png" alt="car" style={{ width: '100%' }} />
        </div>
      </div>
    </section>
  );
}
