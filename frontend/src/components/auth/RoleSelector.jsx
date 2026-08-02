import { User, Users, Hand, ShieldCheck } from 'lucide-react';

const roles = [
  { id: 'resident', label: 'Resident', desc: 'Living at the facility', icon: User, color: '#2F7D6E' },
  { id: 'guardian', label: 'Guardian', desc: 'Family or caretaker', icon: Users, color: '#3D6FA8' },
  { id: 'volunteer', label: 'Volunteer', desc: 'Helping out on-site', icon: Hand, color: '#C98A2E' },
  { id: 'security', label: 'Security', desc: 'On-site staff', icon: ShieldCheck, color: '#8552A1' },
];

export default function RoleSelector({ selectedRole, onSelect }) {
  return (
    <div style={styles.grid}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;
        return (
          <button
            key={role.id}
            onClick={() => onSelect(role.id)}
            style={{
              ...styles.card,
              borderColor: isSelected ? role.color : '#E2E5E3',
              background: isSelected ? `${role.color}12` : '#fff',
              boxShadow: isSelected ? `0 4px 12px ${role.color}30` : '0 1px 2px rgba(0,0,0,0.04)',
              transform: isSelected ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={styles.topRow}>
              <div style={{ ...styles.iconBadge, background: `${role.color}20` }}>
                <Icon size={20} color={role.color} />
              </div>
              <span
                style={{
                  ...styles.radio,
                  borderColor: isSelected ? role.color : '#C7CCC9',
                  background: isSelected ? role.color : 'transparent',
                }}
              />
            </div>
            <span style={{ ...styles.label, color: isSelected ? role.color : '#1B4B43' }}>{role.label}</span>
            <span style={styles.desc}>{role.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

const styles = {
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '24px',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '14px',
    borderRadius: '12px',
    border: '1.5px solid #E2E5E3',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.18s ease',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: '10px',
  },
  iconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radio: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    border: '2px solid #C7CCC9',
  },
  label: {
    fontWeight: 700,
    fontSize: '14px',
  },
  desc: {
    fontSize: '12px',
    color: '#6B7370',
    marginTop: '2px',
  },
};