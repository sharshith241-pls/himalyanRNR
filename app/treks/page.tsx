export default function TreksPage() {
  const treks = [
    { id: "kedarkantha", name: "Kedarkantha Trek", price: 7500 },
    { id: "hampta", name: "Hampta Pass Trek", price: 12999 },
  ];

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Available Treks</h1>

      <ul>
        {treks.map((trek) => (
          <li key={trek.id}>
            <strong>{trek.name}</strong> – ₹{trek.price}
            <br />
            <a href={`/treks/${trek.id}`}>View Details</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
