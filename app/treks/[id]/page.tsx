export default function TrekDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Trek Details</h1>
      <p>Trek ID: {params.id}</p>

      <a href="/checkout">Book This Trek</a>
    </main>
  );
}
