export default function RegisterPage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "400px" }}>
      <h1>Register</h1>

      <input placeholder="Full Name" />
      <br /><br />
      <input type="email" placeholder="Email" />
      <br /><br />
      <input type="password" placeholder="Password" />
      <br /><br />

      <button>Create Account</button>
    </main>
  );
}
