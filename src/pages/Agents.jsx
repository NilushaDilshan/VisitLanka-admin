import React, { useState, useEffect } from "react";
import AdminLayout from "../layout/AdminLayout";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { FaTrash, FaEdit, FaUserTie, FaEnvelope, FaPhone, FaSearch, FaTimes, FaPlus, FaCamera } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Agents.css";

// ✅ Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'gistrbla';
const CLOUDINARY_UPLOAD_PRESET = 'visitlanka_profile';

export default function Agents() {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country: "Sri Lanka",
    photoURL: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    fetchAgents();
  }, []);

  // ================= FETCH =================
  const fetchAgents = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "agents"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const agentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
       ...doc.data(),
      }));
      setAgents(agentsList);
    } catch (err) {
      console.error("Error fetching agents:", err);
      toast.error("Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  // ================= IMAGE PICK =================
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ================= UPLOAD TO CLOUDINARY =================
  const uploadToCloudinary = async (file) => {
    const formDataCloud = new FormData();
    formDataCloud.append('file', file);
    formDataCloud.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formDataCloud.append('folder', 'visitlanka_agents');

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formDataCloud,
        }
      );
      
      const data = await response.json();
      if (response.ok) {
        return data.secure_url;
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  // ================= RESET FORM =================
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      phone: "",
      country: "Sri Lanka",
      photoURL: "",
    });
    setImageFile(null);
    setImagePreview(null);
    setEditId(null);
  };

  // ================= VALIDATE =================
  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Agent name is required");
      return false;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Phone is required");
      return false;
    }
    if (!editId &&!formData.password) {
      toast.error("Password is required for new agents");
      return false;
    }
    if (!editId && formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email format");
      return false;
    }
    return true;
  };

  // ================= SAVE (ADD / UPDATE) =================
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      let photoURL = formData.photoURL;

      if (imageFile) {
        setUploadingImage(true);
        photoURL = await uploadToCloudinary(imageFile);
        setUploadingImage(false);
      }

      if (editId) {
        const agentRef = doc(db, "agents", editId);
        await updateDoc(agentRef, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          contact: formData.phone.trim(),
          country: formData.country.trim(),
          photoURL: photoURL,
          updatedAt: serverTimestamp(),
        });
        toast.success("Agent updated successfully");
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email.trim(),
          formData.password
        );
        const user = userCredential.user;

        await addDoc(collection(db, "agents"), {
          uid: user.uid,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          contact: formData.phone.trim(),
          country: formData.country.trim(),
          photoURL: photoURL,
          role: "agent",
          status: "active",
          createdAt: serverTimestamp(),
          createdBy: localStorage.getItem("userId") || "admin",
        });

        toast.success("Agent created successfully!");
      }

      resetForm();
      fetchAgents();
    } catch (err) {
      console.error("Error saving agent:", err);
      if (err.code === "auth/email-already-in-use") {
        toast.error("Email already exists");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password should be at least 6 characters");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error("Failed to save agent: " + err.message);
      }
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  // ================= EDIT =================
  const handleEdit = (agent) => {
    setFormData({
      name: agent.name || "",
      email: agent.email || "",
      password: "",
      phone: agent.phone || agent.contact || "",
      country: agent.country || "Sri Lanka",
      photoURL: agent.photoURL || "",
    });
    setImagePreview(agent.photoURL || null);
    setImageFile(null);
    setEditId(agent.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ================= DELETE =================
  const handleDelete = async (agentId, agentName) => {
    if (!window.confirm(`Delete agent "${agentName}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "agents", agentId));
      toast.success("Agent deleted successfully");
      fetchAgents();
    } catch (err) {
      console.error("Error deleting agent:", err);
      toast.error("Failed to delete agent");
    }
  };

  // ================= SEARCH =================
  const filteredAgents = agents.filter((a) =>
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.phone?.toLowerCase().includes(search.toLowerCase()) ||
    a.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <ToastContainer position="top-right" theme="dark" />
      <div className="agents-page">
        {/* ================= TOP BAR ================= */}
        <div className="top-bar">
          <h1 className="title">
            <FaUserTie /> Agents Management
          </h1>
          <div className="top-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, phone, country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <FaTimes 
                  className="clear-search" 
                  onClick={() => setSearch("")}
                />
              )}
            </div>
          </div>
        </div>

        {/* ================= FORM ================= */}
        <div className="form-card">
          <h3>{editId? "Edit Agent" : "Add New Agent"}</h3>
          
{/* ✅ IMAGE UPLOAD - TEXT FIELD STYLE */}
<div className="image-upload-group">
  <label>Profile Photo</label>
  <label className="image-upload-field">
    <input
      type="file"
      accept="image/*"
      onChange={handleImageChange}
      style={{ display: 'none' }}
    />
    <FaCamera className="upload-icon" />
    <span className={`upload-text ${imagePreview ? 'has-image' : ''}`}>
      {imagePreview ? 'Photo Selected - Click to Change' : 'Choose Profile Photo'}
    </span>
    {imagePreview && (
      <div className="upload-preview">
        <img src={imagePreview} alt="Preview" />
      </div>
    )}
    {uploadingImage && (
      <div className="upload-overlay">
        <div className="spinner"></div>
        <span>Uploading...</span>
      </div>
    )}
  </label>
  {imagePreview && (
    <button 
      type="button" 
      className="remove-image-btn"
      onClick={() => {
        setImageFile(null);
        setImagePreview(null);
        setFormData({...formData, photoURL: ""});
      }}
    >
      <FaTimes /> Remove Photo
    </button>
  )}
</div>

          
          <div className="form-grid">
            <input
              type="text"
              placeholder="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />

            <input
              type="email"
              placeholder="Email *"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              disabled={!!editId}
            />

            {!editId && (
              <input
                type="password"
                placeholder="Password (min 6 chars) *"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            )}

            <input
              type="tel"
              placeholder="Phone Number *"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />

            <input
              type="text"
              placeholder="Country"
              value={formData.country}
              onChange={(e) => setFormData({...formData, country: e.target.value})}
            />
          </div>

          {editId && <small className="form-note">Email cannot be changed</small>}

          <div className="form-actions">
            <button onClick={handleSave} className="add-btn" disabled={saving || uploadingImage}>
              {saving? "Saving..." : uploadingImage? "Uploading Image..." : editId? <><FaEdit /> Update Agent</> : <><FaPlus /> Add Agent</>}
            </button>
            {editId && (
              <button onClick={resetForm} className="cancel-btn">
                <FaTimes /> Cancel Edit
              </button>
            )}
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="table-wrapper">
          {loading? (
            <div className="loading-state">Loading agents...</div>
          ) : (
            <table className="dest-table">
              <thead>
                <tr>
                  <th>No</th>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredAgents.length === 0? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      {search? "No agents match your search" : "No agents found. Add your first agent!"}
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent, index) => (
                    <tr key={agent.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="table-avatar">
                          {agent.photoURL? (
                            <img 
                              src={agent.photoURL.replace('/upload/', '/upload/w_80,h_80,c_fill/')} 
                              alt={agent.name}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <FaUserTie />
                          )}
                        </div>
                      </td>
                      <td className="hotel-name">{agent.name}</td>
                      <td>
                        <div className="cell-with-icon">
                          <FaEnvelope className="cell-icon" />
                          {agent.email}
                        </div>
                      </td>
                      <td>
                        <div className="cell-with-icon">
                          <FaPhone className="cell-icon" />
                          {agent.phone || agent.contact || "-"}
                        </div>
                      </td>
                      <td>{agent.country || "-"}</td>
                      <td>
                        <span className={`badge badge-${agent.status || 'active'}`}>
                          {agent.status || "active"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(agent)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(agent.id, agent.name)}
                            className="delete-btn"
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
