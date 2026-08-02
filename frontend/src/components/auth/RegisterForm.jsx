import { useState } from 'react';
import axios from 'axios';
import { User, Mail, Lock, Phone, Eye, EyeOff, UserPlus } from 'lucide-react';
const roleFields = {
  resident: [
    { name: 'roomNumber', label: 'Room / Unit Number', type: 'text', icon: User },
    { name: 'guardianContact', label: "Guardian's Phone Number", type: 'text', icon: Phone },
  ],
  guardian: [
    { name: 'phone', label: 'Your Phone Number', type: 'text', icon: Phone },
    { name: 'relationship', label: 'Relationship to Resident', type: 'text', icon: User },
    { name: 'residentName', label: "Resident's Name", type: 'text', icon: User },
  ],
  volunteer: [
    { name: 'phone', label: 'Your Phone Number', type: 'text', icon: Phone },
    { name: 'availability', label: 'Availability (e.g. weekends, evenings)', type: 'text', icon: User },
  ],
  security: [
    { name: 'staffId', label: 'Staff ID', type: 'text', icon: User },
    { name: 'shift', label: 'Shift Timing (e.g. 9am-5pm)', type: 'text', icon: User },
  ],
};

export default function RegisterForm({ role }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!role) {
    return <p style={{ color: '#6B7370', fontSize: '14px' }}>Select a role above to continue.</p>;
  }

  const extraFields = roleFields[role] || [];

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8000/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        room_number: formData.roomNumber || null,
        guardian_contact: formData.guardianContact || null,
        relationship_to_resident: formData.relationship || null,
        resident_name: formData.residentName || null,
        availability: formData.availability || null,
        staff_id: formData.staffId || null,
        shift: formData.shift || null,
        phone: formData.phone || null,
      });
      setSuccessMsg(`Account created successfully for ${response.data.name}!`);
    } catch (error) {
      if (error.response) {
        setErrorMsg(error.response.data.detail || 'Registration failed');
      } else {
        setErrorMsg('Could not connect to server');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <label style={styles.label}>Full Name</label>
      <div style={styles.inputWrapper}>
        <User size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter your full name"
          required
          style={styles.input}
        />
      </div>

      <label style={styles.label}>Email Address</label>
      <div style={styles.inputWrapper}>
        <Mail size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          placeholder="Enter your email address"
          required
          style={styles.input}
        />
      </div>

      {extraFields.map((field) => {
        const FieldIcon = field.icon;
        return (
          <div key={field.name}>
            <label style={styles.label}>{field.label}</label>
            <div style={styles.inputWrapper}>
              <FieldIcon size={18} color="#8A9490" style={styles.leftIcon} />
              <input
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required
                style={styles.input}
              />
            </div>
          </div>
        );
      })}

      <label style={styles.label}>Password</label>
      <div style={styles.inputWrapper}>
        <Lock size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          placeholder="Create a password"
          required
          style={{ ...styles.input, paddingRight: '38px' }}
        />
        <button type="button" onClick={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
          {showPassword ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
        </button>
      </div>

      <label style={styles.label}>Confirm Password</label>
      <div style={styles.inputWrapper}>
        <Lock size={18} color="#8A9490" style={styles.leftIcon} />
        <input
          type={showConfirm ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          placeholder="Confirm your password"
          required
          style={{ ...styles.input, paddingRight: '38px' }}
        />
        <button type="button" onClick={() => setShowConfirm((p) => !p)} style={styles.eyeButton}>
          {showConfirm ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
        </button>
      </div>

      <button type="submit" style={styles.button}>
        <UserPlus size={16} />
        Register
      </button>

      {errorMsg && <p style={{ color: '#C0392B', fontSize: '13px', marginTop: '10px' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: '#2F7D6E', fontSize: '13px', marginTop: '10px' }}>{successMsg}</p>}
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
  button: {
    marginTop: '20px',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    background: 'linear-gradient(to right, #3D6FA8, #2F5C8F)',
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

// import { useState } from 'react';
// import axios from 'axios';
// import { User, Mail, Lock, Phone, Eye, EyeOff, UserPlus } from 'lucide-react';

// const roleFields = {
//   resident: [
//     { name: 'roomNumber', label: 'Room / Unit Number', type: 'text', icon: User },
//     { name: 'guardianContact', label: "Guardian's Phone Number", type: 'text', icon: Phone },
//   ],
//   guardian: [
//     { name: 'relationship', label: 'Relationship to Resident', type: 'text', icon: User },
//     { name: 'residentName', label: "Resident's Name", type: 'text', icon: User },
//   ],
//   volunteer: [
//     { name: 'availability', label: 'Availability (e.g. weekends, evenings)', type: 'text', icon: User },
//   ],
//   security: [
//     { name: 'staffId', label: 'Staff ID', type: 'text', icon: User },
//     { name: 'shift', label: 'Shift Timing (e.g. 9am-5pm)', type: 'text', icon: User },
//   ],
// };

// export default function RegisterForm({ role }) {
//   const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
//   const [showPassword, setShowPassword] = useState(false);
//   const [showConfirm, setShowConfirm] = useState(false);

//   if (!role) {
//     return <p style={{ color: '#6B7370', fontSize: '14px' }}>Select a role above to continue.</p>;
//   }

//   const extraFields = roleFields[role] || [];

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({ ...prev, [field]: value }));
//   };

//   const [errorMsg, setErrorMsg] = useState('');
// const [successMsg, setSuccessMsg] = useState('');

// const handleSubmit = async (e) => {
//   e.preventDefault();
//   setErrorMsg('');
//   setSuccessMsg('');

//   if (formData.password !== formData.confirmPassword) {
//     setErrorMsg('Passwords do not match');
//     return;
//   }

//   try {
//     const response = await axios.post('http://localhost:8000/register', {
//       name: formData.name,
//       email: formData.email,
//       password: formData.password,
//       role: role,
//       room_number: formData.roomNumber || null,
//       guardian_contact: formData.guardianContact || null,
//       relationship_to_resident: formData.relationship || null,
//       resident_name: formData.residentName || null,
//       availability: formData.availability || null,
//       staff_id: formData.staffId || null,
//       shift: formData.shift || null,
//     });
//     setSuccessMsg(`Account created successfully for ${response.data.name}!`);
//   } catch (error) {
//     if (error.response) {
//       setErrorMsg(error.response.data.detail || 'Registration failed');
//     } else {
//       setErrorMsg('Could not connect to server');
//     }
//   }
// };

//   return (
//     <form onSubmit={handleSubmit} style={styles.form}>
//       <label style={styles.label}>Full Name</label>
//       <div style={styles.inputWrapper}>
//         <User size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type="text"
//           value={formData.name}
//           onChange={(e) => handleChange('name', e.target.value)}
//           placeholder="Enter your full name"
//           required
//           style={styles.input}
//         />
//       </div>

//       <label style={styles.label}>Email Address</label>
//       <div style={styles.inputWrapper}>
//         <Mail size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type="email"
//           value={formData.email}
//           onChange={(e) => handleChange('email', e.target.value)}
//           placeholder="Enter your email address"
//           required
//           style={styles.input}
//         />
//       </div>

//       {extraFields.map((field) => {
//         const FieldIcon = field.icon;
//         return (
//           <div key={field.name}>
//             <label style={styles.label}>{field.label}</label>
//             <div style={styles.inputWrapper}>
//               <FieldIcon size={18} color="#8A9490" style={styles.leftIcon} />
//               <input
//                 type={field.type}
//                 value={formData[field.name] || ''}
//                 onChange={(e) => handleChange(field.name, e.target.value)}
//                 required
//                 style={styles.input}
//               />
//             </div>
//           </div>
//         );
//       })}

//       <label style={styles.label}>Password</label>
//       <div style={styles.inputWrapper}>
//         <Lock size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type={showPassword ? 'text' : 'password'}
//           value={formData.password}
//           onChange={(e) => handleChange('password', e.target.value)}
//           placeholder="Create a password"
//           required
//           style={{ ...styles.input, paddingRight: '38px' }}
//         />
//         <button type="button" onClick={() => setShowPassword((p) => !p)} style={styles.eyeButton}>
//           {showPassword ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
//         </button>
//       </div>

//       <label style={styles.label}>Confirm Password</label>
//       <div style={styles.inputWrapper}>
//         <Lock size={18} color="#8A9490" style={styles.leftIcon} />
//         <input
//           type={showConfirm ? 'text' : 'password'}
//           value={formData.confirmPassword}
//           onChange={(e) => handleChange('confirmPassword', e.target.value)}
//           placeholder="Confirm your password"
//           required
//           style={{ ...styles.input, paddingRight: '38px' }}
//         />
//         <button type="button" onClick={() => setShowConfirm((p) => !p)} style={styles.eyeButton}>
//           {showConfirm ? <EyeOff size={18} color="#8A9490" /> : <Eye size={18} color="#8A9490" />}
//         </button>
//       </div>

//       <button type="submit" style={styles.button}>
//         <UserPlus size={16} />
//         Register
//       </button>
// {errorMsg && <p style={{ color: '#C0392B', fontSize: '13px', marginTop: '10px' }}>
//   {errorMsg}</p>}
// {successMsg && <p style={{ color: '#2F7D6E', fontSize: '13px', marginTop: '10px' }}>         {successMsg}</p>}     
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
//   button: {
//     marginTop: '20px',
//     padding: '12px',
//     borderRadius: '8px',
//     border: 'none',
//     background: 'linear-gradient(to right, #3D6FA8, #2F5C8F)',
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