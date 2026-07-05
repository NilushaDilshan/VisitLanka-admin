import React, { useEffect, useState } from "react";
import AdminLayout from "../layout/AdminLayout";
import "./Dashboard.css";

import { collection, getDocs, query, where, Timestamp, orderBy } from "firebase/firestore";
import { db } from "../firebase/firebase";

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    bookings: 0,
    hotels: 0,
    vehicles: 0,
    todayHotelBookings: 0,
    tripPlannings: 0,
  });
  
  const [todayHotelList, setTodayHotelList] = useState([]);
  const [todayTripList, setTodayTripList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Today's range - 00:00 to 23:59
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = Timestamp.fromDate(today);
        
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const endOfDayTs = Timestamp.fromDate(endOfDay);

        // Basic stats
        const [usersSnap, bookingsSnap, hotelsSnap, vehiclesSnap, tripsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "bookings")),
          getDocs(collection(db, "hotels")),
          getDocs(collection(db, "vehicles")),
          getDocs(collection(db, "trips")),
        ]);

        // ================= TODAY HOTEL BOOKINGS - FIXED =================
        let todayHotelData = [];
        try {
          // ✅ FIXED: Use "checkIn" instead of "checkInDate"
          const todayHotelQuery = query(
            collection(db, "bookings"),
            where("checkIn", ">=", startOfDay),
            where("checkIn", "<=", endOfDayTs),
            orderBy("checkIn", "desc")
          );
          const todayHotelSnap = await getDocs(todayHotelQuery);
          todayHotelData = todayHotelSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
        } catch (err) {
          console.warn("checkIn query failed, using client-side filter:", err.message);
          // Fallback: filter by checkIn client-side if index missing
          const allBookings = bookingsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          todayHotelData = allBookings.filter(booking => {
            const checkIn = booking.checkIn;
            if (!checkIn) return false;
            const checkInMs = checkIn.seconds ? checkIn.seconds * 1000 : new Date(checkIn).getTime();
            return checkInMs >= startOfDay.toMillis() && checkInMs <= endOfDayTs.toMillis();
          }).sort((a, b) => {
            const dateA = a.checkIn?.seconds || 0;
            const dateB = b.checkIn?.seconds || 0;
            return dateB - dateA;
          });
        }

        // ================= TODAY TRIP PLANNINGS =================
        let todayTripData = [];
        try {
          const allTrips = tripsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          todayTripData = allTrips.filter(trip => {
            const startDate = trip.tripDetails?.startDate;
            if (!startDate) return false;
            
            let startMs;
            if (startDate.seconds) {
              startMs = startDate.seconds * 1000;
            } else {
              startMs = new Date(startDate).getTime();
            }
            
            return startMs >= startOfDay.toMillis() && startMs <= endOfDayTs.toMillis();
          }).sort((a, b) => {
            const dateA = a.tripDetails?.startDate?.seconds || 0;
            const dateB = b.tripDetails?.startDate?.seconds || 0;
            return dateB - dateA;
          });
        } catch (err) {
          console.warn("Today trip filter failed:", err.message);
        }

        setStats({
          users: usersSnap.size,
          bookings: bookingsSnap.size,
          hotels: hotelsSnap.size,
          vehicles: vehiclesSnap.size,
          todayHotelBookings: todayHotelData.length,
          tripPlannings: todayTripData.length,
        });

        setTodayHotelList(todayHotelData);
        setTodayTripList(todayTripData);

      } catch (err) {
        console.error("Dashboard error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
    } catch {
      return "-";
    }
  };

  const formatDateOnly = (timestamp) => {
    if (!timestamp) return "-";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "-";
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="dashboard">
          <div className="error-state">Failed to load: {error}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="dashboard">
        <h1>Dashboard Overview</h1>

        <div className="grid">
          <div className="card users">
            <h3>👤 Users</h3>
            <div className="stat-number">{loading ? "..." : stats.users}</div>
          </div>

          <div className="card bookings">
            <h3>📅 Total Bookings</h3>
            <div className="stat-number">{loading ? "..." : stats.bookings}</div>
          </div>

          <div className="card hotels">
            <h3>🏨 Hotels</h3>
            <div className="stat-number">{loading ? "..." : stats.hotels}</div>
          </div>

          <div className="card vehicles">
            <h3>🚗 Vehicles</h3>
            <div className="stat-number">{loading ? "..." : stats.vehicles}</div>
          </div>

          <div className="card today-hotels">
            <h3>🏨 Today's Check-ins</h3>
            <div className="stat-number">{loading ? "..." : stats.todayHotelBookings}</div>
          </div>

          <div className="card today-trips">
            <h3>🗺 Today's Trips</h3>
            <div className="stat-number">{loading ? "..." : stats.tripPlannings}</div>
          </div>
        </div>

        {/* TODAY HOTEL BOOKINGS TABLE - FIXED */}
        <div className="table-section">
          <h2>Today's Hotel Bookings</h2>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : todayHotelList.length === 0 ? (
            <div className="empty-state">No hotel check-ins today</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Guest Name</th>
                    <th>Email</th>
                    <th>Hotel</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Rooms</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayHotelList.map((booking, index) => (
                    <tr key={booking.id}>
                      <td>{index + 1}</td>
                      <td>{booking.userName || booking.guestName || "-"}</td>
                      <td>{booking.userEmail || "-"}</td>
                      <td>{booking.hotelName || "-"}</td>
                      <td>{formatDate(booking.checkIn)}</td>
                      <td>{formatDate(booking.checkOut)}</td>
                      <td>{booking.rooms || 1}</td>
                      <td>Rs. {booking.totalAmount || 0}</td>
                      <td>
                        <span className={`badge ${booking.status || 'pending'}`}>
                          {booking.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TODAY TRIP PLANNINGS TABLE */}
        <div className="table-section">
          <h2>Today's Trip Plannings</h2>
          {loading ? (
            <div className="loading-text">Loading...</div>
          ) : todayTripList.length === 0 ? (
            <div className="empty-state">No trips starting today</div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>User</th>
                    <th>Email</th>
                    <th>City</th>
                    <th>Start Date</th>
                    <th>Duration</th>
                    <th>Travelers</th>
                    <th>Vehicle</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayTripList.map((trip, index) => (
                    <tr key={trip.id}>
                      <td>{index + 1}</td>
                      <td>{trip.userInfo?.displayName || trip.userEmail || "Guest"}</td>
                      <td>{trip.userInfo?.email || trip.userEmail || "-"}</td>
                      <td>{trip.tripDetails?.city || "-"}</td>
                      <td>{formatDateOnly(trip.tripDetails?.startDate)}</td>
                      <td>{trip.tripDetails?.days ? `${trip.tripDetails.days} days` : "-"}</td>
                      <td>{trip.tripDetails?.travelers || "-"}</td>
                      <td>{trip.vehicle?.vehicleName || "-"}</td>
                      <td>Rs. {trip.costBreakdown?.totalCost || 0}</td>
                      <td>
                        <span className={`badge ${trip.status || 'pending'}`}>
                          {trip.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
