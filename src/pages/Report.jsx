import React, { useEffect, useState } from 'react';
import AdminLayout from "../layout/AdminLayout";
import { db } from "../firebase/firebase";
import { collection, getDocs } from 'firebase/firestore';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import {
  FaDollarSign, FaCalendarCheck, FaUsers,
  FaHotel, FaCar, FaMapMarkerAlt
} from 'react-icons/fa';

import './Report.css';

const COLORS = ['#00C2A8', '#009B87', '#FF8042', '#FFBB28', '#0088FE', '#FF6384'];

const ReportPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    uniqueDestinations: 0,
    placeBookings: 0,
    totalDestinations: 0
  });

  const [totalCounts, setTotalCounts] = useState({
    places: 0,
    hotels: 0,
    vehicles: 0,
    users: 0
  });

  const [userGrowth, setUserGrowth] = useState([]);
  const [topPlaces, setTopPlaces] = useState([]);
  const [pieData, setPieData] = useState([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bookingsSnap, usersSnap, placesSnap, hotelsSnap, vehiclesSnap, destinationsSnap] = await Promise.all([
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'places')),
        getDocs(collection(db, 'hotels')),
        getDocs(collection(db, 'vehicles')),
        getDocs(collection(db, 'destinations'))
      ]);

      // Process bookings
      let revenue = 0;
      const destinationCount = {};
      const placeDestinations = new Set();
      let placeBookingsCount = 0;

      bookingsSnap.forEach(doc => {
        const data = doc.data();

        // Revenue: check multiple fields
        revenue += data.totalAmount || data.price || data.amount || 0;

        // Top destinations: check placeName, hotelName, city
        let destination = null;
        if (data.type === 'hotel') {
          destination = data.hotelName || data.city;
        } else if (data.type === 'vehicle') {
          destination = data.city || 'Vehicle Booking';
        } else {
          destination = data.placeName || data.city || data.destination;
          if (destination) {
            placeDestinations.add(destination);
            placeBookingsCount++;
          }
        }

        if (destination) {
          destinationCount[destination] = (destinationCount[destination] || 0) + 1;
        }
      });

      // Top 5 destinations
      const top = Object.keys(destinationCount)
     .map(key => ({ name: key, value: destinationCount[key] }))
     .sort((a, b) => b.value - a.value)
     .slice(0, 5);

      setTopPlaces(top);
      setSummary({
        totalRevenue: revenue,
        totalBookings: bookingsSnap.size,
        uniqueDestinations: placeDestinations.size,
        placeBookings: placeBookingsCount,
        totalDestinations: destinationsSnap.size
      });

      // ✅ FIX: Process users - CUMULATIVE growth
      const userDates = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        let date;

        if (data.createdAt?.toDate) {
          date = data.createdAt.toDate();
        } else if (data.createdAt) {
          date = new Date(data.createdAt);
        } else if (data.created_at?.toDate) {
          date = data.created_at.toDate();
        } else {
          return; // skip if no date
        }

        if (!isNaN(date.getTime())) {
          userDates.push(date);
        }
      });

      // Sort by date
      userDates.sort((a, b) => a - b);

      // Group by month and make cumulative
      const monthlyMap = {};
      userDates.forEach(date => {
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap[key] = (monthlyMap[key] || 0) + 1;
      });

      // Convert to cumulative
      let cumulative = 0;
      const formatted = Object.keys(monthlyMap)
     .sort()
     .map(k => {
        cumulative += monthlyMap[k];
        return {
          month: k,
          users: cumulative // ✅ Cumulative total
        };
      });

      setUserGrowth(formatted);

      // Set counts
      const counts = {
        users: usersSnap.size,
        places: placesSnap.size,
        hotels: hotelsSnap.size,
        vehicles: vehiclesSnap.size
      };
      setTotalCounts(counts);

      // Set pie data
      setPieData([
        { name: 'Users', value: counts.users },
        { name: 'Hotels', value: counts.hotels },
        { name: 'Vehicles', value: counts.vehicles },
        { name: 'Places', value: counts.places }
      ]);

    } catch (e) {
      console.error("Error fetching data:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("VisitLanka Report", 14, 18);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 38,
      head: [["Report", "Value"]],
      body: [
        ["Total Revenue", `Rs ${summary.totalRevenue.toLocaleString()}`],
        ["Total Bookings", summary.totalBookings],
        ["Total Destinations", summary.totalDestinations],
        ["Unique Destinations Booked", summary.uniqueDestinations],
        ["Place Bookings", summary.placeBookings],
        ["Total Users", totalCounts.users],
        ["Total Hotels", totalCounts.hotels],
        ["Total Vehicles", totalCounts.vehicles],
      ],
      headStyles: {
        fillColor: [0, 194, 168],
        textColor: 255,
      },
      styles: {
        fontSize: 11,
      },
    });

    if (topPlaces.length > 0) {
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 15,
        head: [["Top Destination", "Bookings"]],
        body: topPlaces.map(place => [
          place.name,
          place.value,
        ]),
        headStyles: {
          fillColor: [0, 155, 135],
          textColor: 255,
        },
      });
    }

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [["Category", "Count"]],
      body: pieData.map(item => [
        item.name,
        item.value,
      ]),
      headStyles: {
        fillColor: [0, 136, 254],
        textColor: 255,
      },
    });

    doc.save(`VisitLanka_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="report-loading">Loading...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="report-container">
        {/* ================= HEADER ================= */}
        <div className="report-header">
          <div>
            <h1>Reports Dashboard</h1>
            <p>VisitLanka Analytics & Statistics</p>
          </div>
          <button className="export-btn" onClick={exportPDF}>
            📄 Export PDF
          </button>
        </div>

        {/* ================= SUMMARY ================= */}
        <div className="summary-grid">
          <div className="summary-card">
            <FaDollarSign />
            <div>
              <h3>Rs {summary.totalRevenue.toLocaleString()}</h3>
              <p>Revenue</p>
            </div>
          </div>

          <div className="summary-card">
            <FaCalendarCheck />
            <div>
              <h3>{summary.totalBookings}</h3>
              <p>Total Bookings</p>
            </div>
          </div>

          <div className="summary-card">
            <FaUsers />
            <div>
              <h3>{totalCounts.users}</h3>
              <p>Users</p>
            </div>
          </div>

          <div className="summary-card">
            <FaMapMarkerAlt />
            <div>
              <h3>{summary.totalDestinations}</h3>
              <p>Destinations</p>
              <small style={{color: '#94a3b8', fontSize: '12px'}}>
                {summary.uniqueDestinations} booked • {summary.placeBookings} bookings
              </small>
            </div>
          </div>

          <div className="summary-card">
            <FaHotel />
            <div>
              <h3>{totalCounts.hotels}</h3>
              <p>Hotels</p>
            </div>
          </div>

          <div className="summary-card">
            <FaCar />
            <div>
              <h3>{totalCounts.vehicles}</h3>
              <p>Vehicles</p>
            </div>
          </div>
        </div>

        {/* ================= CHARTS ================= */}
        <div className="charts-grid">
          {/* USER GROWTH LINE CHART - CUMULATIVE */}
          <div className="chart-card full-width">
            <h3>📈 User Growth (Cumulative)</h3>
            {userGrowth.length > 0? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelFormatter={(label) => `Month: ${label}`}
                    formatter={(value) => [`${value} users`, 'Total Users']}
                  />
                  <Line
                    type="monotone"
                    dataKey="users"
                    stroke="#00C2A8"
                    strokeWidth={3}
                    dot={{ fill: '#00C2A8', r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>No user data available</p>
            )}
          </div>

          {/* TOP DESTINATIONS */}
          <div className="chart-card">
            <h3>📍 Top Destinations</h3>
            {topPlaces.length > 0? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topPlaces}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="#cbd5e1" />
                  <YAxis stroke="#cbd5e1" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#009B87" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#94a3b8' }}>No destination data available</p>
            )}
          </div>

          {/* PIE CHART */}
          <div className="chart-card">
            <h3>🥧 System Overview</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  label
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportPage;
