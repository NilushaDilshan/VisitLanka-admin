import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logo from "../assets/logo.jpg";
import bg from "../assets/loginback.jpg";
import "./Login.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const navigate = useNavigate();
  const auth = getAuth();
  const db = getFirestore();

  // ✅ FIX: Login page එකට ආවම Firebase session එක තිබ්බත් clear කරනවා
  // එතකොට හැම වෙලේම fresh login එකක් ඉල්ලනවා
  useEffect(() => {
    const checkAuth = async () => {
      // Firebase එකේ currentUser ඉන්නවද බලනවා
      const currentUser = auth.currentUser;

      // Session එක තියෙනවා නම් logout කරලා දානවා
      if (currentUser) {
        await auth.signOut();
        localStorage.removeItem("user");
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [auth]);

  const handleLogin = async () => {
    if (!email.trim() ||!password) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // 1. Admin check
      if (user.email === "admin@gmail.com") {
        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            name: "Admin",
            email: user.email,
            role: "admin",
            country: "Sri Lanka",
            phone: "0711234567",
          })
        );
        toast.success("Welcome Admin!");
        navigate("/dashboard");
        return;
      }

      // 2. Agent check
      const agentsRef = collection(db, "agents");
      const q = query(agentsRef, where("email", "==", user.email.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const agentDoc = querySnapshot.docs[0];
        const agentData = agentDoc.data();

        if (agentData.status === "inactive" || agentData.status === "suspended") {
          toast.error("Your account is inactive. Contact admin.");
          await auth.signOut();
          localStorage.removeItem("user");
          setLoading(false);
          return;
        }

        localStorage.setItem(
          "user",
          JSON.stringify({
            uid: user.uid,
            id: agentDoc.id,
            name: agentData.name,
            email: agentData.email,
            role: "agent",
            country: agentData.country || "Sri Lanka",
            phone: agentData.phone || agentData.contact || "",
          })
        );

        toast.success(`Welcome ${agentData.name}!`);
        navigate("/dashboard");
      } else {
        toast.error("Access denied. Not an authorized account.");
        await auth.signOut();
        localStorage.removeItem("user");
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Try again later");
      } else {
        toast.error("Login Failed: " + err.message);
      }
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  if (checkingAuth) {
    return (
      <div className="login-page" style={{
        backgroundImage: `url(${bg})`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ color: 'white', fontSize: '24px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        height: "100vh",
      }}
    >
      <ToastContainer position="top-right" theme="dark" />
      <div className="login-overlay">
        <div className="logo-wrapper">
          <div className="logo-circle">
            <img src={logo} alt="logo" />
          </div>
        </div>

        <h1 className="title">
          <span className="blue">Visit</span>{" "}
          <span className="green">Lanka</span>
        </h1>

        <p className="subtitle">Explore The Beauty Of Sri Lanka</p>

        <div className="login-card">
          <h2>Login</h2>

          <div className="input-box">
            <span className="icon">📧</span>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="input-box">
            <span className="icon">🔒</span>
            <input
              type={showPassword? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <span
              className="eye"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword? "🙈" : "👁"}
            </span>
          </div>

          <button onClick={handleLogin} disabled={loading}>
            {loading? "Loading..." : "LOGIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
