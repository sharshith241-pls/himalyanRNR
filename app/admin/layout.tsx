import { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main style={{ padding: "2rem", background: "#1d0505" }}>
      <h1>Admin Panel</h1>
      {children}
    </main>
  );
}
