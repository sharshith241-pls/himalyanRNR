export default function LoginPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "400px" }}>
      <h1>Login</h1>

      <input type="email" placeholder="Email" />
      <br /><br />
      <input type="password" placeholder="Password" />
      <br /><br />

      <button>Login</button>
    </main>
  );
}
