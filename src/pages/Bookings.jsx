import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./Bookings.css";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export default function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // ================= ✅ UNIVERSAL SAFE DATE FORMATTER =================
  const formatDate = (value) => {
    if (!value) return "-";
    
    try {
      // Case 1: Firestore Timestamp object
      if (value instanceof Timestamp) {
        return value.toDate().toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      
      // Case 2: Object with seconds/nanoseconds
      if (typeof value === "object" && value.seconds) {
        return new Date(value.seconds * 1000).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      
      // Case 3: String or number
      return new Date(value).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.log("Date format error:", error, value);
      return "-";
    }
  };

  // ================= ✅ SAFE VALUE RENDERER =================
  const safeRender = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      if (value instanceof Timestamp || value.seconds) {
        return formatDate(value);
      }
      return "-";
    }
    return value;
  };

  // ================= FETCH BOOKINGS FROM BOTH COLLECTIONS =================
  const fetchBookings = async () => {
    try {
      setLoading(true);

      // 1. Fetch trips collection - type = trip
      const tripsQuery = query(
        collection(db, "trips"),
        orderBy("createdAt", "desc")
      );
      const tripsSnapshot = await getDocs(tripsQuery);
      const tripsList = tripsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: "trip", // force type
        collection: "trips", // track source collection
        ...doc.data(),
      }));

      // 2. Fetch bookings collection - type = hotel
      const bookingsQuery = query(
        collection(db, "bookings"),
        orderBy("createdAt", "desc")
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const hotelList = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        type: "hotel", // force type
        collection: "bookings", // track source collection
        ...doc.data(),
      }));

      // 3. Merge both lists
      const allBookings = [...tripsList, ...hotelList].sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0;
        const dateB = b.createdAt?.seconds || 0;
        return dateB - dateA; // newest first
      });

      setBookings(allBookings);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // ================= UPDATE STATUS =================
  const updateStatus = async (id, status, collectionName) => {
    try {
      const bookingRef = doc(db, collectionName, id);

      await updateDoc(bookingRef, {
        status: status,
        updatedAt: Timestamp.now(),
      });

      alert(`Booking ${status}`);
      fetchBookings();
    } catch (error) {
      console.log(error);
      alert("Error updating status");
    }
  };

  // ================= DELETE BOOKING =================
  const deleteBooking = async (id, collectionName) => {
    const confirmDelete = window.confirm("Delete this booking?");

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, collectionName, id));
      alert("Booking Deleted");
      fetchBookings();
    } catch (error) {
      console.log(error);
      alert("Error deleting booking");
    }
  };

  // ================= FILTER BOOKINGS =================
  const filteredBookings = bookings.filter((booking) => {
    const typeMatch = filterType === "all" || booking.type === filterType;
    const statusMatch = filterStatus === "all" || booking.status === filterStatus;
    return typeMatch && statusMatch;
  });

  return (
    <AdminLayout>
      <div className="booking-page">
        <div className="booking-header">
          <h2>Booking Management</h2>
          <div className="booking-filters">
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="trip">Trip Plans</option>
              <option value="hotel">Hotel Bookings</option>
            </select>

            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="approved">Approved</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <button className="refresh-btn" onClick={fetchBookings}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="no-data">
            <p>No bookings found</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Details</th>
                  <th>Total Cost</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((item, index) => (
                  <tr key={`${item.collection}-${item.id}`}>
                    <td>{index + 1}</td>
                    <td>
                      <span className={`type-badge ${item.type}`}>
                        {item.type === "trip" ? "🗺 Trip" : "🏨 Hotel"}
                      </span>
                    </td>
                    <td>{safeRender(item.userName || item.userEmail || item.cardDetails?.cardHolder || "Guest")}</td>
                    <td>{safeRender(item.userEmail || "-")}</td>
                    <td>{safeRender(item.userPhone || "-")}</td>
                    <td>{safeRender(item.tripDetails?.city || item.city || "-")}</td>
                    <td>
                      {item.type === "trip" ? (
                        <div className="trip-details">
                          <div><strong>Days:</strong> {safeRender(item.tripDetails?.days)}</div>
                          <div><strong>Travelers:</strong> {safeRender(item.tripDetails?.travelers)}</div>
                          <div><strong>Vehicle:</strong> {safeRender(item.vehicle?.vehicleName)}</div>
                          <div><strong>Places:</strong> {item.destinations?.length || 0}</div>
                        </div>
                      ) : (
                        <div className="hotel-details">
                          <div><strong>Hotel:</strong> {safeRender(item.hotelName || "-")}</div>
                          <div><strong>Check-in:</strong> {formatDate(item.checkIn)}</div>
                          <div><strong>Check-out:</strong> {formatDate(item.checkOut)}</div>
                          <div><strong>Rooms:</strong> {safeRender(item.rooms || 1)}</div>
                        </div>
                      )}
                    </td>
                    <td className="cost-cell">
                      <strong>Rs. {item.costBreakdown?.totalCost || item.totalAmount || 0}</strong>
                      {item.costBreakdown && (
                        <div className="cost-breakdown">
                          <small>Vehicle: {item.costBreakdown.vehicleCost || 0}</small>
                          <small>Food: {item.costBreakdown.foodCost || 0}</small>
                          <small>Entry: {item.costBreakdown.destinationCost || 0}</small>
                          {item.costBreakdown.hotelCost > 0 && (
                            <small>Hotel: {item.costBreakdown.hotelCost}</small>
                          )}
                        </div>
                      )}
                      {item.type === "trip" && item.paymentStatus && (
                        <div className="payment-info">
                          <small style={{color: item.paymentStatus === 'advance_paid' ? '#00C2A8' : '#ff9800'}}>
                            Advance: Rs. {item.costBreakdown?.advancePaid || 0}
                          </small>
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${item.status || "pending"}`}>
                        {item.status || "pending"}
                      </span>
                    </td>
                    <td className="date-cell">
                      {formatDate(item.createdAt)}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {item.status !== "approved" && (
                          <button
                            className="btn-approve"
                            onClick={() => updateStatus(item.id, "approved", item.collection)}
                            title="Approve"
                          >
                            ✓
                          </button>
                        )}
                        {item.status !== "confirmed" && (
                          <button
                            className="btn-confirm"
                            onClick={() => updateStatus(item.id, "confirmed", item.collection)}
                            title="Confirm"
                          >
                            ✔
                          </button>
                        )}
                        {item.status !== "cancelled" && (
                          <button
                            className="btn-cancel"
                            onClick={() => updateStatus(item.id, "cancelled", item.collection)}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          className="btn-delete"
                          onClick={() => deleteBooking(item.id, item.collection)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
