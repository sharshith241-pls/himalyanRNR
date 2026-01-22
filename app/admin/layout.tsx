import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main style={{ padding: "2rem", background: "#f5f5f5" }}>
      <h1>Admin Panel</h1>
      {children}
    </main>
  );
}
