// import { useState } from 'react';
// import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

// export default function LoginForm({ role }) {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [rememberMe, setRememberMe] = useState(false);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Logging in as', role, { email, password, rememberMe });
//   };

//   if (!role) {
//     return <p style={{ color: '#6B7370', fontSize: '14px' }}>Select a role above to continue.</p>;
//   }

//   return (
//     <form onSubmit={handleSubmit} style={styles.form}>
//       <label style={styles.label}>Email Address</label>
//       <div style={styles.inputWrapper}>
//         <Mail size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type="email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           placeholder="Enter your email address"
//           required
//           style={styles.input}
//         />
//       </div>

//       <label style={styles.label}>Password</label>
//       <div style={styles.inputWrapper}>
//         <Lock size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type={showPassword ? 'text' : 'password'}
//           value={password}
//           onChange={(e) => setPassword(e.target.value)}
//           placeholder="Enter your password"
//           required
//           style={{ ...styles.input, paddingRight: '38px' }}
//         />
//         <button
//           type="button"
//           onClick={() => setShowPassword((prev) => !prev)}
//           style={styles.eyeButton}
//         >
//           {showPassword ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
//         </button>
//       </div>

//       <div style={styles.row}>
//         <label style={styles.checkboxLabel}>
//           <input
//             type="checkbox"
//             checked={rememberMe}
//             onChange={(e) => setRememberMe(e.target.checked)}
//           />
//           Remember me
//         </label>
//         <span style={styles.forgotLink}>Forgot Password?</span>
//       </div>

//       <button type="submit" style={styles.button}>
//         <LogIn size={16} />
//         Login
//       </button>
//     </form>
//   );
// }

// const styles = {
//   form: { display: 'flex', flexDirection: 'column', gap: '4px' },
//   label: { fontSize: '13px', color: '#1B4B43', fontWeight: 500, marginTop: '14px' },
//   inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
//   leftIcon: { position: 'absolute', left: '12px' },
//   input: {
//     width: '100%',
//     padding: '10px 12px 10px 38px',
//     borderRadius: '8px',
//     border: '1.5px solid #E2E5E3',
//     fontSize: '14px',
//     outline: 'none',
//     background: '#fff',
//     color: '#1B4B43',
//     boxSizing: 'border-box',
//   },
//   eyeButton: {
//     position: 'absolute',
//     right: '10px',
//     background: 'none',
//     border: 'none',
//     cursor: 'pointer',
//     padding: 0,
//     display: 'flex',
//   },
//   row: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginTop: '12px',
//     fontSize: '13px',
//   },
//   checkboxLabel: {
//     display: 'flex',
//     alignItems: 'center',
//     gap: '6px',
//     color: '#1B4B43',
//   },
//   forgotLink: {
//     color: '#3D6FA8',
//     cursor: 'pointer',
//   },
//   button: {
//     marginTop: '20px',
//     padding: '12px',
//     borderRadius: '8px',
//     border: 'none',
//     background: '#3D6FA8',
//     color: '#fff',
//     fontWeight: 600,
//     fontSize: '14px',
//     cursor: 'pointer',
//     display: 'flex',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: '8px',
//   },
// };
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginForm({ role }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  if (!role) {
    return <p style={{ color: '#6B7370', fontSize: '14px' }}>Select a role above to continue.</p>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await axios.post('http://localhost:8000/login', {
        email,
        password,
      });

      const loggedInRole = response.data.role;
      localStorage.setItem('userId', response.data.id);
      localStorage.setItem('userName', response.data.name);
      localStorage.setItem('userRole', response.data.role);

      if (loggedInRole === 'resident') navigate('/resident-dashboard');
      else if (loggedInRole === 'guardian') navigate('/guardian-dashboard');
      else if (loggedInRole === 'volunteer') navigate('/volunteer-dashboard');
      else if (loggedInRole === 'security') navigate('/security-dashboard');
      else if (loggedInRole === 'admin') navigate('/admin-dashboard');
      else setErrorMsg('Unknown role, cannot redirect');
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.detail || 'Login failed');
      } else {
        setErrorMsg('Could not connect to server');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <label style={styles.label}>Email Address</label>
      <div style={styles.inputWrapper}>
        <Mail size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          required
          style={styles.input}
        />
      </div>

      <label style={styles.label}>Password</label>
      <div style={styles.inputWrapper}>
        <Lock size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          style={{ ...styles.input, paddingRight: '38px' }}
        />
        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          style={styles.eyeButton}
        >
          {showPassword ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
        </button>
      </div>

      <div style={styles.row}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>
        <span style={styles.forgotLink}>Forgot Password?</span>
      </div>

      <button type="submit" style={styles.button}>
        <LogIn size={16} />
        Login
      </button>

      {errorMsg && <p style={{ color: '#C0392B', fontSize: '13px', marginTop: '10px' }}>{errorMsg}</p>}
    </form>
  );
}

const styles = {
  form: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '13px', color: '#1B4B43', fontWeight: 500, marginTop: '14px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  leftIcon: { position: 'absolute', left: '12px' },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '8px',
    border: '1.5px solid #E2E5E3',
    fontSize: '14px',
    outline: 'none',
    background: '#fff',
    color: '#1B4B43',
    boxSizing: 'border-box',
  },
  eyeButton: {
    position: 'absolute',
    right: '10px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    display: 'flex',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    fontSize: '13px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#1B4B43',
  },
  forgotLink: {
    color: '#3D6FA8',
    cursor: 'pointer',
  },
  button: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: '#3D6FA8',
    color: '#fff',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
};
