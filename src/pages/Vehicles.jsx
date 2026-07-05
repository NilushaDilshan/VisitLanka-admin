import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./Vehicle.css"; // Fixed typo: Vehilce -> Vehicle

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

// ================= COLOR SYSTEM =================
const kPrimary = "#00C2A8";
const kPrimaryDark = "#009B87";
const kTextDark = "#1A2B2A";
const kTextLight = "#6B7F7D";

export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    vehicleName: "",
    vehicleType: "",
    brand: "",
    model: "",
    year: "",
    pricePerDay: "",
    seats: "",
    fuelType: "",
    transmission: "",
    image: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    location: "",
    description: "",
  });

  const vehicleTypes = ["Car", "SUV", "Van", "Bus", "Bike", "Tuk Tuk", "Jeep"];
  const fuelTypes = ["Petrol", "Diesel", "Hybrid", "Electric"];
  const transmissions = ["Manual", "Automatic"];

  // ================= FETCH =================
  const fetchVehicles = async () => {
    const snap = await getDocs(collection(db, "vehicles"));
    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
    setVehicles(list);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  // ================= RESET FORM =================
  const resetForm = () => {
    setForm({
      vehicleName: "",
      vehicleType: "",
      brand: "",
      model: "",
      year: "",
      pricePerDay: "",
      seats: "",
      fuelType: "",
      transmission: "",
      image: "",
      ownerName: "",
      ownerPhone: "",
      ownerEmail: "",
      location: "",
      description: "",
    });
    setEditId(null);
  };

  // ================= VALIDATION =================
  const validateForm = () => {
    if (!form.vehicleName.trim()) {
      alert("Vehicle name is required");
      return false;
    }
    if (!form.vehicleType) {
      alert("Vehicle type is required");
      return false;
    }
    if (!form.brand.trim()) {
      alert("Brand is required");
      return false;
    }
    if (!form.model.trim()) {
      alert("Model is required");
      return false;
    }
    if (!form.year || !/^[0-9]{4}$/.test(form.year) || form.year < 1990 || form.year > 2026) {
      alert("Enter valid year between 1990-2026");
      return false;
    }
    if (!form.pricePerDay || isNaN(form.pricePerDay) || Number(form.pricePerDay) <= 0) {
      alert("Enter valid price per day");
      return false;
    }
    if (!form.seats || !/^[0-9]+$/.test(form.seats) || form.seats < 1 || form.seats > 50) {
      alert("Enter valid seat count 1-50");
      return false;
    }
    if (!form.fuelType) {
      alert("Fuel type is required");
      return false;
    }
    if (!form.transmission) {
      alert("Transmission is required");
      return false;
    }
    if (!form.image.trim()) {
      alert("Image URL is required");
      return false;
    }
    if (!form.ownerName.trim()) {
      alert("Owner name is required");
      return false;
    }

    // FIXED: Strict 10-digit phone validation for Sri Lanka: 0771234567
    if (!form.ownerPhone.trim()) {
      alert("Owner phone is required");
      return false;
    }
    const cleanedPhone = form.ownerPhone.replace(/[\s-]/g, '');
    if (!/^0[0-9]{9}$/.test(cleanedPhone)) {
      alert("Phone number must be exactly 10 digits: 0771234567");
      return false;
    }

    if (!form.ownerEmail.trim()) {
      alert("Owner email is required");
      return false;
    }
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.ownerEmail.trim())) {
      alert("Enter valid email");
      return false;
    }
    if (!form.location.trim()) {
      alert("Location is required");
      return false;
    }

    return true;
  };

  // ================= HANDLE PHONE INPUT =================
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ''); // Only allow digits
    if (value.length <= 10) {
      setForm({ ...form, ownerPhone: value });
    }
  };

  // ================= SAVE (ADD / UPDATE) =================
  const handleSave = async () => {
    if (!validateForm()) return;

    const dataToSave = {
      ...form,
      year: Number(form.year),
      pricePerDay: Number(form.pricePerDay),
      seats: Number(form.seats),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editId) {
        await updateDoc(doc(db, "vehicles", editId), dataToSave);
        alert("Vehicle updated successfully!");
      } else {
        await addDoc(collection(db, "vehicles"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        alert("Vehicle added successfully!");
      }

      resetForm();
      fetchVehicles();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      await deleteDoc(doc(db, "vehicles", id));
      fetchVehicles();
    }
  };

  // ================= EDIT =================
  const handleEdit = (vehicle) => {
    setForm({
      vehicleName: vehicle.vehicleName || "",
      vehicleType: vehicle.vehicleType || "",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      year: vehicle.year || "",
      pricePerDay: vehicle.pricePerDay || "",
      seats: vehicle.seats || "",
      fuelType: vehicle.fuelType || "",
      transmission: vehicle.transmission || "",
      image: vehicle.image || "",
      ownerName: vehicle.ownerName || "",
      ownerPhone: vehicle.ownerPhone || "",
      ownerEmail: vehicle.ownerEmail || "",
      location: vehicle.location || "",
      description: vehicle.description || "",
    });
    setEditId(vehicle.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= SEARCH =================
  const filteredVehicles = vehicles.filter((v) =>
    v.vehicleName?.toLowerCase().includes(search.toLowerCase()) ||
    v.brand?.toLowerCase().includes(search.toLowerCase()) ||
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.vehicleType?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="destination-page">
        {/* ================= TOP BAR ================= */}
        <div className="top-bar">
          <h1 className="title">Vehicle Management</h1>
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search by name, brand, model, type, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ================= FORM ================= */}
        <div className="form-card">
          <h3>{editId ? "Edit Vehicle" : "Add New Vehicle"}</h3>
          
          <div className="form-grid">
            <input
              type="text"
              placeholder="Vehicle Name *"
              value={form.vehicleName}
              onChange={(e) => setForm({ ...form, vehicleName: e.target.value })}
              required
            />

            <select
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              required
            >
              <option value="">Select Vehicle Type *</option>
              {vehicleTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Brand *"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Model *"
              value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })}
              required
            />

            <input
              type="number"
              placeholder="Year *"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: e.target.value })}
              min="1990"
              max="2026"
              required
            />

            <input
              type="number"
              placeholder="Price Per Day (Rs) *"
              value={form.pricePerDay}
              onChange={(e) => setForm({ ...form, pricePerDay: e.target.value })}
              min="0"
              required
            />

            <input
              type="number"
              placeholder="Seats *"
              value={form.seats}
              onChange={(e) => setForm({ ...form, seats: e.target.value })}
              min="1"
              max="50"
              required
            />

            <select
              value={form.fuelType}
              onChange={(e) => setForm({ ...form, fuelType: e.target.value })}
              required
            >
              <option value="">Select Fuel Type *</option>
              {fuelTypes.map((fuel) => (
                <option key={fuel} value={fuel}>{fuel}</option>
              ))}
            </select>

            <select
              value={form.transmission}
              onChange={(e) => setForm({ ...form, transmission: e.target.value })}
              required
            >
              <option value="">Select Transmission *</option>
              {transmissions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Image URL *"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Owner Name *"
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              required
            />

            <input
              type="tel"
              placeholder="Owner Phone: 0771234567 *"
              value={form.ownerPhone}
              onChange={handlePhoneChange}
              maxLength={10}
              pattern="[0-9]*"
              inputMode="numeric"
              required
            />

            <input
              type="email"
              placeholder="Owner Email *"
              value={form.ownerEmail}
              onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
              required
            />

            <input
              type="text"
              placeholder="Location (City) *"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              required
            />
          </div>

          <textarea
            placeholder="Description / Features"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={handleSave} className="add-btn">
              {editId ? "Update Vehicle" : "+ Add Vehicle"}
            </button>
            {editId && (
              <button onClick={resetForm} className="cancel-btn">
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="table-wrapper">
          <table className="dest-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Image</th>
                <th>Vehicle</th>
                <th>Type</th>
                <th>Brand/Model</th>
                <th>Year</th>
                <th>Price/Day</th>
                <th>Seats</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: "center", padding: "20px" }}>
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v, index) => (
                  <tr key={v.id}>
                    <td>{index + 1}</td>
                    <td>
                      <img
                        src={v.image}
                        alt={v.vehicleName}
                        className="table-img"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/60";
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{v.vehicleName}</td>
                    <td>
                      <span className={`badge badge-${v.vehicleType?.toLowerCase()}`}>
                        {v.vehicleType || "-"}
                      </span>
                    </td>
                    <td>{v.brand} {v.model}</td>
                    <td>{v.year}</td>
                    <td style={{ color: kPrimary, fontWeight: 600 }}>
                      Rs. {v.pricePerDay?.toLocaleString()}
                    </td>
                    <td>{v.seats}</td>
                    <td>{v.location || "-"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleEdit(v)}
                          className="edit-btn"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(v.id)}
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
