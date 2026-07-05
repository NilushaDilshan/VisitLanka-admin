import "./Users.css";
import AdminLayout from "../layout/AdminLayout";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { toast } from "react-toastify";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // 🔄 FETCH USERS
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, "users"));

      const list = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsers(list);
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 CLEAN SEARCH (case + safe)
  const filteredUsers = users.filter((u) => {
    const searchText = search.toLowerCase();

    return (
      (u.name || u.fullName || "").toLowerCase().includes(searchText) ||
      (u.email || "").toLowerCase().includes(searchText) ||
      (u.phone || u.contact || "").toLowerCase().includes(searchText) ||
      (u.country || "").toLowerCase().includes(searchText)
    );
  });

  // 🟥 BLOCK / UNBLOCK
  const toggleBlockUser = async (userId, currentStatus) => {
    try {
      const userRef = doc(db, "users", userId);
      const newStatus = currentStatus === "Blocked" ? "Active" : "Blocked";

      await updateDoc(userRef, {
        status: newStatus,
      });

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: newStatus } : u
        )
      );

      toast.success(`User ${newStatus === "Blocked" ? "blocked" : "unblocked"} successfully`);
    } catch (err) {
      console.error("Error updating user:", err);
      toast.error("Failed to update user status");
    }
  };

  // ❌ DELETE USER
  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      toast.error("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Loading users...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="user-page">
        {/* HEADER */}
        <div className="page-header">
          <h1>User Management</h1>

          {/* 🔍 CLEAN SEARCH BOX */}
          <input
            className="search-input"
            placeholder="Search by name, email, phone, country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <div className="table-card">
          <table className="user-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Profile</th> {/* ✅ Aluth Column */}
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Country</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr key={user.id}>
                    {/* 🔢 NO */}
                    <td>{index + 1}</td>

                    {/* ✅ PROFILE IMAGE */}
                    <td>
                      <div className="user-avatar">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.name || "User"}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/40?text=👤";
                            }}
                          />
                        ) : (
                          <div className="avatar-placeholder">
                            {(user.name || user.fullName || "U")[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="user-name">
                        {user.name || user.fullName || "N/A"}
                      </div>
                    </td>

                    <td>{user.email || "N/A"}</td>
                    <td>{user.phone || user.contact || "N/A"}</td>
                    <td>{user.country || "N/A"}</td>

                    {/* STATUS */}
                    <td>
                      <span
                        className={`status ${
                          user.status === "Blocked" ? "blocked" : "active"
                        }`}
                      >
                        {user.status || "Active"}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="actions">
                      <button
                        className="btn block"
                        onClick={() =>
                          toggleBlockUser(user.id, user.status)
                        }
                      >
                        {user.status === "Blocked" ? "Unblock" : "Block"}
                      </button>

                      <button
                        className="btn delete"
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="no-data"> {/* ✅ colSpan 8 karala */}
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
