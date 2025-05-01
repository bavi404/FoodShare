import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  AuthErrorCodes,
} from "firebase/auth";
import { getDatabase, ref, get } from 'firebase/database';
import "../css/login.css";
import { FaGoogle } from "react-icons/fa"; // ✅ Using react-icons

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loginWithGoogle = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      window.localStorage.setItem("user", JSON.stringify(user));

      const dbRef = ref(getDatabase(), `users/${user.uid}`);
      const snapshot = await get(dbRef);

      if (snapshot.exists()) {
        navigate("/dashboard");
      } else {
        navigate("/personal-info");
      }
    } catch (error) {
      console.error("Error during Google login:", error);
      navigate('/register');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then((userCredential) => {
        const user = userCredential.user;
        window.localStorage.setItem("user", JSON.stringify(user));
        navigate("/dashboard");
      })
      .catch((err) => {
        if (
          err.code === AuthErrorCodes.INVALID_PASSWORD ||
          err.code === AuthErrorCodes.USER_DELETED
        ) {
          setError("The email address or password is incorrect");
          navigate("/register");
        } else {
          console.log(err.code);
          alert(err.code);
        }
      });
  };

  const switchToSignup = () => navigate("/register");

  return (
    <div className="loginMain">
      <div className="wrapper">
        <div className="title-text">
          <div className="title login">Welcome Back</div>
        </div>
        <div className="form-container">
          <div className="slide-controls">
            <input type="radio" name="slide" id="login" checked readOnly />
            <input type="radio" name="slide" id="signup" onChange={switchToSignup} />
            <label htmlFor="login" className="slide login">Login</label>
            <label htmlFor="signup" className="slide signup">Signup</label>
            <div className="slider-tab"></div>
          </div>

          <div className="form-inner">
            <form onSubmit={handleSubmit} className="login">
              <div className="field">
                <input
                  type="text"
                  placeholder="Email address"
                  name="email"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field">
                <input
                  type="password"
                  placeholder="Password"
                  name="password"
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="field btn">
                <div className="btn-layer"></div>
                <input type="submit" value="Login" />
              </div>
              {error && <div className="error">{error}</div>}

              <div className="signup mt-3">
                <button
                  type="button"
                  onClick={loginWithGoogle}
                  className="btn btn-social btn-google"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FaGoogle /> Sign in with Google
                </button>
              </div>

              <div className="signup-link">
                New here? <a href="#" onClick={switchToSignup}>Create an account</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
