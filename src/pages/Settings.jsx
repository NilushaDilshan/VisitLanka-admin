import React, { useState, useEffect } from 'react';
import {
  getAuth,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Settings.css';
import AdminLayout from "../layout/AdminLayout";

const SettingsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('main');

  const menuItems = [
    { id: 'profile', icon: '👤', title: 'Profile Settings', desc: 'Update your personal information' },
    { id: 'password', icon: '🔒', title: 'Change Password', desc: 'Update your password' },
    { id: 'company', icon: '🏢', title: 'Company Information', desc: 'Visit Lanka details & contact' },
    { id: 'about', icon: 'ℹ', title: 'About Visit Lanka', desc: 'App version & terms' },
  ];

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    localStorage.clear();
    toast.info('Logged out successfully');
    navigate('/');
  };

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
      window.history.replaceState({}, document.title);
    }
  }, [location.key, location.state]);

  return (
    <AdminLayout>
      <div className="settings-container">
        <div className="settings-wrapper">
          <div className="settings-header">
            {activeTab!== 'main' && (
              <button onClick={() => setActiveTab('main')} className="back-btn">
                ← Back
              </button>
            )}
            <h1 className="settings-title">
              {activeTab === 'main'? 'Settings' :
                menuItems.find(item => item.id === activeTab)?.title || 'Settings'}
            </h1>
          </div>

          {activeTab === 'main' && (
            <div className="menu-list">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="menu-item"
                >
                  <div className="menu-item-content">
                    <span className="menu-icon">{item.icon}</span>
                    <div className="menu-text">
                      <div className="menu-title">{item.title}</div>
                      <div className="menu-desc">{item.desc}</div>
                    </div>
                  </div>
                  <span className="menu-arrow">›</span>
                </button>
              ))}

              <button onClick={handleLogout} className="menu-item logout-item">
                <div className="menu-item-content">
                  <span className="menu-icon">🚪</span>
                  <div className="menu-text">
                    <div className="menu-title logout-title">Logout</div>
                    <div className="menu-desc">Sign out from your account</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {activeTab === 'profile' && <ProfileSettings onBack={() => setActiveTab('main')} />}
          {activeTab === 'password' && <ChangePassword onBack={() => setActiveTab('main')} />}
          {activeTab === 'company' && <CompanyInfo />}
          {activeTab === 'about' && <AboutSystem />}
        </div>
      </div>
    </AdminLayout>
  );
};

// ==================== HELPER: Get correct doc ref based on role ====================
const getUserDocRef = async (db) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;

  const user = JSON.parse(userStr);
  const role = user.role;

  if (role === 'admin') {
    return doc(db, 'users', user.uid);
  }

  if (role === 'agent') {
    return doc(db, 'agents', user.id || user.uid);
  }

  if (role === 'guide') {
    return doc(db, 'guides', user.id || user.uid);
  }

  return doc(db, 'users', user.uid);
};

// ==================== PROFILE SETTINGS ====================
const ProfileSettings = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    country: '',
    language: '',
    email: ''
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const db = getFirestore();
      const docRef = await getUserDocRef(db);

      if (!docRef) {
        setError('User session invalid. Please login again.');
        setLoading(false);
        return;
      }

      const docSnap = await getDoc(docRef);
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');

      if (docSnap.exists()) {
        const data = docSnap.data();
        setFormData({
          fullName: data.fullName || data.name || localUser.name || '',
          phone: data.phone || data.contact || localUser.phone || '',
          country: data.country || localUser.country || '',
          language: data.language || localUser.language || 'English',
          email: data.email || localUser.email || ''
        });
      } else {
        setFormData({
          fullName: localUser.name || '',
          phone: localUser.phone || '',
          country: localUser.country || '',
          language: localUser.language || 'English',
          email: localUser.email || ''
        });
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const db = getFirestore();
      const docRef = await getUserDocRef(db);

      if (!docRef) {
        setError('User session invalid');
        setSaving(false);
        return;
      }

      const updateData = {
        updatedAt: new Date().toISOString(),
        fullName: formData.fullName,
        name: formData.fullName,
        phone: formData.phone,
        contact: formData.phone,
        country: formData.country,
        language: formData.language
      };

      await setDoc(docRef, updateData, { merge: true });

      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
      ...localUser,
        name: formData.fullName,
        phone: formData.phone,
        country: formData.country,
        language: formData.language
      }));

      toast.success('Profile updated successfully');
      onBack();
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {error && <div className="error-msg">{error}</div>}
      <InputField
        label="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({...formData, fullName: e.target.value})}
        required
      />
      <InputField
        label="Email (Cannot change)"
        value={formData.email}
        disabled
        type="email"
      />
      <InputField
        label="Phone Number"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        type="tel"
        required
      />
      <InputField
        label="Country"
        value={formData.country}
        onChange={(e) => setFormData({...formData, country: e.target.value})}
        required
      />
      <div className="input-group">
        <label className="input-label">Preferred Language</label>
        <select
          value={formData.language}
          onChange={(e) => setFormData({...formData, language: e.target.value})}
          className="input-field"
          required
        >
          <option value="">Select Language</option>
          <option value="English">English</option>
          <option value="Sinhala">Sinhala</option>
          <option value="Tamil">Tamil</option>
          <option value="Hindi">Hindi</option>
          <option value="German">German</option>
          <option value="French">French</option>
          <option value="Chinese">Chinese</option>
          <option value="Japanese">Japanese</option>
        </select>
      </div>
      <SaveButton text={saving? 'Updating...' : 'Update Profile'} disabled={saving} />
    </form>
  );
};

// ==================== CHANGE PASSWORD ====================
const ChangePassword = ({ onBack }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserEmail(user.email || '');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.newPassword!== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        toast.error('Session expired. Please login again.');
        navigate('/');
        return;
      }

      const credential = EmailAuthProvider.credential(user.email, formData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, formData.newPassword);

      toast.success('Password changed successfully');
      onBack();
    } catch (err) {
      console.error('Password change error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Current password is incorrect');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else if (err.code === 'auth/requires-recent-login') {
        setError('Please logout and login again to change password');
      } else {
        setError('Error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      {error && <div className="error-msg">{error}</div>}
      <InputField
        label="Email"
        type="email"
        value={userEmail}
        disabled
      />
      <InputField
        label="Current Password"
        type="password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
        required
      />
      <InputField
        label="New Password"
        type="password"
        value={formData.newPassword}
        onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
        required
      />
      <InputField
        label="Confirm New Password"
        type="password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        required
      />
      <SaveButton text={loading? 'Changing...' : 'Change Password'} disabled={loading} />
    </form>
  );
};

// ==================== COMPANY INFORMATION ====================
const CompanyInfo = () => {
  const info = [
    { title: 'Visit Lanka', icon: '🇱🇰', content: 'Your trusted travel partner in Sri Lanka since 2015' },
    { title: 'Head Office', icon: '📍', content: 'No. 45, Temple Road,\nKandy 20000, Sri Lanka' },
    { title: 'Contact', icon: '📞', content: '+94 81 234 5678\n+94 77 123 4567' },
    { title: 'Email', icon: '✉', content: 'info@visitlanka.lk\nbooking@visitlanka.lk' },
    { title: 'Working Hours', icon: '🕐', content: 'Monday - Saturday: 8:00 AM - 6:00 PM\nSunday: 9:00 AM - 2:00 PM\n24/7 Emergency Support' },
    { title: 'Emergency Hotline', icon: '🚨', content: '+94 77 999 8888', color: 'green' },
  ];

  return (
    <div className="info-list">
      {info.map((item, idx) => (
        <div key={idx} className={`info-card ${item.color === 'green'? 'info-card-green' : ''}`}>
          <div className="info-card-header">
            <span className="info-icon">{item.icon}</span>
            <h3 className={`info-title ${item.color === 'green'? 'text-green' : ''}`}>{item.title}</h3>
          </div>
          <p className="info-content">{item.content}</p>
        </div>
      ))}
    </div>
  );
};

// ==================== ABOUT SYSTEM ====================
const AboutSystem = () => {
  const sections = [
    { title: 'Developed By', content: 'Visit Lanka Tech Team\n© 2024 All Rights Reserved' },
    { title: 'Description', content: 'Visit Lanka helps you explore Sri Lanka with ease. Book tours, hire experienced guides, discover hidden gems, and create unforgettable memories across the island.' },
    { title: 'Terms & Conditions', content: 'By using this app, you agree to our terms of service and privacy policy. Your data is encrypted and secure. Booking cancellations follow our refund policy.' },
    { title: 'Support', content: 'For technical support:\nsupport@visitlanka.lk\n+94 81 234 5678\n24/7 WhatsApp: +94 77 123 4567' },
  ];

  return (
    <div className="about-container">
      <div className="about-header">
        <div className="about-logo">🌴</div>
        <h2 className="about-app-name">Visit Lanka</h2>
        <p className="about-version">Version 2.1.0</p>
      </div>
      {sections.map((sec, idx) => (
        <div key={idx} className="about-card">
          <h3 className="about-card-title">{sec.title}</h3>
          <p className="about-card-content">{sec.content}</p>
        </div>
      ))}
    </div>
  );
};

// ==================== COMMON COMPONENTS ====================
const InputField = ({ label, value, onChange, type = 'text', required = false, textarea = false, disabled = false }) => {
  const Input = textarea? 'textarea' : 'input';
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={textarea? 3 : undefined}
        className={`input-field ${disabled? 'input-disabled' : ''}`}
      />
    </div>
  );
};

const SaveButton = ({ text, disabled, onClick }) => {
  return (
    <button
      type={onClick? 'button' : 'submit'}
      onClick={onClick}
      disabled={disabled}
      className="save-button"
    >
      {text}
    </button>
  );
};

export default SettingsPage;
