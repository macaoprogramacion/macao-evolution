"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { DashboardUser } from "@/lib/supabase-users"

export default function AdminEmergencyPage() {
  const [users, setUsers] = useState<DashboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newPin, setNewPin] = useState("")
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    setLoading(true)
    const { data, error } = await supabase
      .from("dashboard_users")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      setError("Error cargando usuarios: " + error.message)
    } else {
      setUsers(data || [])
    }
    setLoading(false)
  }

  async function resetPin(userId: string) {
    if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setError("El PIN debe ser exactamente 6 dígitos numéricos")
      return
    }
    setError("")
    const { error } = await supabase
      .from("dashboard_users")
      .update({ pin: newPin, updated_at: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      setError("Error actualizando PIN: " + error.message)
    } else {
      setSuccess("PIN actualizado correctamente")
      setNewPin("")
      setSelectedUser(null)
      loadUsers()
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>🔑 Admin Emergency Access</h1>
        <p style={{ color: "#888", marginBottom: "2rem" }}>
          Panel de emergencia para recuperar acceso. Cambia tu PIN aquí y luego inicia sesión en <a href="/admin" style={{ color: "#60a5fa" }}>/admin</a>.
        </p>

        {error && (
          <div style={{ background: "#7f1d1d", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem" }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#14532d", padding: "0.75rem 1rem", borderRadius: 8, marginBottom: "1rem" }}>
            {success}
          </div>
        )}

        {loading ? (
          <p>Cargando usuarios...</p>
        ) : users.length === 0 ? (
          <p style={{ color: "#f87171" }}>No se encontraron usuarios en la tabla dashboard_users.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #333", textAlign: "left" }}>
                <th style={{ padding: "0.75rem" }}>Nombre</th>
                <th style={{ padding: "0.75rem" }}>Email</th>
                <th style={{ padding: "0.75rem" }}>Rol</th>
                <th style={{ padding: "0.75rem" }}>PIN actual</th>
                <th style={{ padding: "0.75rem" }}>Activo</th>
                <th style={{ padding: "0.75rem" }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: "0.75rem" }}>{user.name}</td>
                  <td style={{ padding: "0.75rem", color: "#93c5fd" }}>{user.email}</td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ background: "#1e3a5f", padding: "2px 8px", borderRadius: 4, fontSize: "0.85rem" }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem", fontFamily: "monospace" }}>{user.pin}</td>
                  <td style={{ padding: "0.75rem" }}>{user.active ? "✅" : "❌"}</td>
                  <td style={{ padding: "0.75rem" }}>
                    {selectedUser === user.id ? (
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="Nuevo PIN"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                          style={{
                            background: "#222",
                            border: "1px solid #444",
                            color: "#fff",
                            padding: "4px 8px",
                            borderRadius: 4,
                            width: 90,
                            fontFamily: "monospace",
                          }}
                        />
                        <button
                          onClick={() => resetPin(user.id)}
                          style={{ background: "#16a34a", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => { setSelectedUser(null); setNewPin("") }}
                          style={{ background: "#444", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedUser(user.id)}
                        style={{ background: "#2563eb", color: "#fff", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
                      >
                        Cambiar PIN
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: "2rem", padding: "1rem", background: "#1a1a1a", borderRadius: 8, color: "#888", fontSize: "0.85rem" }}>
          <strong style={{ color: "#f59e0b" }}>⚠️ Importante:</strong> Elimina esta página después de recuperar el acceso. Ruta: <code>app/admin-emergency/page.tsx</code>
        </div>
      </div>
    </div>
  )
}
