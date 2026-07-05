import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./Destinations.css";

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function DestinationManagement() {
  const [destinations, setDestinations] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    district: "",
    category: "",
    image: "",
    entryFee: "",
    description: "",
    map: "",
  });

  // FETCH
  const fetchDestinations = async () => {
    const snap = await getDocs(collection(db, "destinations"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setDestinations(list);
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  // RESET FORM
  const resetForm = () => {
    setForm({
      name: "",
      city: "",
      district: "",
      category: "",
      image: "",
      entryFee: "",
      description: "",
      map: "",
    });
    setEditingId(null);
  };

  // ADD OR UPDATE
  const handleSubmit = async () => {
    if (!form.name || !form.city || !form.district || !form.category || !form.image) {
      alert("Please fill required fields: Name, City, District, Category, Image");
      return;
    }

    const dataToSave = {
      ...form,
      entryFee: form.entryFee ? Number(form.entryFee) : 0,
      updatedAt: serverTimestamp(),
    };

    if (editingId) {
      await updateDoc(doc(db, "destinations", editingId), dataToSave);
    } else {
      await addDoc(collection(db, "destinations"), {
        ...dataToSave,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    fetchDestinations();
  };

  // EDIT
  const handleEdit = (dest) => {
    setForm({
      name: dest.name || "",
      city: dest.city || "",
      district: dest.district || "",
      category: dest.category || "",
      image: dest.image || "",
      entryFee: dest.entryFee || "",
      description: dest.description || "",
      map: dest.map || "",
    });
    setEditingId(dest.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // DELETE
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this destination?")) {
      await deleteDoc(doc(db, "destinations", id));
      fetchDestinations();
    }
  };

  // SEARCH
  const filteredDestinations = destinations.filter((d) =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    d.city?.toLowerCase().includes(search.toLowerCase()) ||
    d.district?.toLowerCase().includes(search.toLowerCase()) ||
    d.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="destination-page">
        {/* TOP BAR */}
        <div className="top-bar">
          <h1 className="title">Destination Management</h1>
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by name, city, district, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* FORM */}
        <div className="form-card">
          <h3>{editingId ? "Edit Destination" : "Add New Destination"}</h3>
          
          <div className="form-grid">
            <input
              type="text"
              placeholder="Destination Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="City *"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="District *"
              value={form.district}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
              required
            />

            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select Category *</option>
              <option value="Historical">Historical</option>
              <option value="Nature">Nature</option>
              <option value="Beach">Beach</option>
              <option value="Mountain">Mountain</option>
              <option value="Wildlife">Wildlife</option>
              <option value="Cultural">Cultural</option>
              <option value="Adventure">Adventure</option>
            </select>

            <input
              type="text"
              placeholder="Image URL *"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Entry Fee (Optional)"
              value={form.entryFee}
              onChange={(e) => setForm({ ...form, entryFee: e.target.value })}
            />

            <input
              type="text"
              placeholder="Google Map Link"
              value={form.map}
              onChange={(e) => setForm({ ...form, map: e.target.value })}
            />
          </div>

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSubmit} className="add-btn">
              {editingId ? "Update Destination" : "+ Add Destination"}
            </button>
            {editingId && (
              <button onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* TABLE - ALL FIELDS */}
        <div className="table-wrapper">
          <table className="dest-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Image</th>
                <th>Name</th>
                <th>City</th>
                <th>District</th>
                <th>Category</th>
                <th>Entry Fee</th>
                <th>Description</th>
                <th>Map</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredDestinations.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                    No destinations found
                  </td>
                </tr>
              ) : (
                filteredDestinations.map((d, index) => (
                  <tr key={d.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={d.image}
                        alt={d.name}
                        className="table-img"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/60";
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{d.name}</td>
                    <td>{d.city}</td>
                    <td>{d.district}</td>
                    <td>
                      <span className={`badge badge-${d.category?.toLowerCase()}`}>
                        {d.category}
                      </span>
                    </td>
                    <td>Rs. {d.entryFee || 0}</td>
                    <td className="desc-cell">
                      {d.description?.length > 50 
                        ? d.description.substring(0, 50) + "..." 
                        : d.description || "-"}
                    </td>
                    <td>
                      {d.map ? (
                        <a
                          href={d.map}
                          target="_blank"
                          rel="noreferrer"
                          className="map-link"
                        >
                          View
                        </a>
                      ) : "-"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(d)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}