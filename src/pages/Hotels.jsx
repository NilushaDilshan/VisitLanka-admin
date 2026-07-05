import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./Hotels.css";

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

export default function HotelManagement() {
  const [hotels, setHotels] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    city: "",
    district: "",
    category: "",
    image: "",
    rating: "",
    price: "",
    distance: "",
    description: "",
    map: "",
  });

  // ================= FETCH =================
  const fetchHotels = async () => {
    const snap = await getDocs(collection(db, "hotels"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setHotels(list);
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      name: "",
      city: "",
      district: "",
      category: "",
      image: "",
      rating: "",
      price: "",
      distance: "",
      description: "",
      map: "",
    });
    setEditId(null);
  };

  // ================= SAVE (ADD / UPDATE) =================
  const handleSave = async () => {
    if (!form.name || !form.city || !form.district || !form.category || !form.image) {
      alert("Please fill required fields: Name, City, District, Category, Image");
      return;
    }

    const dataToSave = {
      ...form,
      rating: form.rating ? Number(form.rating) : 0,
      updatedAt: serverTimestamp(),
    };

    if (editId) {
      await updateDoc(doc(db, "hotels", editId), dataToSave);
    } else {
      await addDoc(collection(db, "hotels"), {
        ...dataToSave,
        createdAt: serverTimestamp(),
      });
    }

    resetForm();
    fetchHotels();
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this hotel?")) {
      await deleteDoc(doc(db, "hotels", id));
      fetchHotels();
    }
  };

  // ================= EDIT =================
  const handleEdit = (hotel) => {
    setForm({
      name: hotel.name || "",
      city: hotel.city || "",
      district: hotel.district || "",
      category: hotel.category || "",
      image: hotel.image || "",
      rating: hotel.rating || "",
      price: hotel.price || "",
      distance: hotel.distance || "",
      description: hotel.description || "",
      map: hotel.map || "",
    });
    setEditId(hotel.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= SEARCH =================
  const filteredHotels = hotels.filter((h) =>
    h.name?.toLowerCase().includes(search.toLowerCase()) ||
    h.city?.toLowerCase().includes(search.toLowerCase()) ||
    h.district?.toLowerCase().includes(search.toLowerCase()) ||
    h.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="destination-page">
        {/* ================= TOP BAR ================= */}
        <div className="top-bar">
          <h1 className="title">Hotel Management</h1>
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

        {/* ================= FORM ================= */}
        <div className="form-card">
          <h3>{editId ? "Edit Hotel" : "Add New Hotel"}</h3>
          
          <div className="form-grid">
            <input
              type="text"
              placeholder="Hotel Name *"
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
              <option value="Luxury">Luxury</option>
              <option value="Budget">Budget</option>
              <option value="Resort">Resort</option>
              <option value="Boutique">Boutique</option>
              <option value="Villa">Villa</option>
              <option value="Guest House">Guest House</option>
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
              placeholder="Rating (0-5)"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              min="0"
              max="5"
              step="0.1"
            />

            <input
              type="text"
              placeholder="Price (e.g. Rs. 15,000/night)"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />

            <input
              type="text"
              placeholder="Distance (e.g. 2 km from city)"
              value={form.distance}
              onChange={(e) => setForm({ ...form, distance: e.target.value })}
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
            <button onClick={handleSave} className="add-btn">
              {editId ? "Update Hotel" : "+ Add Hotel"}
            </button>
            {editId && (
              <button onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ================= TABLE - ONLY: Name, City, District, Category, Image, Rating, Action ================= */}
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
                <th>Rating</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                    No hotels found
                  </td>
                </tr>
              ) : (
                filteredHotels.map((h, index) => (
                  <tr key={h.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={h.image}
                        alt={h.name}
                        className="table-img"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/60";
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td>{h.city || "-"}</td>
                    <td>{h.district || "-"}</td>
                    <td>
                      <span className={`badge badge-${h.category?.toLowerCase()}`}>
                        {h.category || "-"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: "#FFB400" }}>★</span>
                        {h.rating || 0}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(h)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(h.id)}
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