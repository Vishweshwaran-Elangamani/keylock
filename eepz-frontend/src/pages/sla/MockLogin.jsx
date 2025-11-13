// src/pages/sla/MockLogin.jsx - MINIMAL MOCK LOGIN (6 USERS)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield } from 'lucide-react';

// ========== MINIMAL USER DATA ==========
const users = [
  {
    empId: 1,
    employeeId: 1,
    employeeCode: 'EEPZ-HR-001',
    firstName: 'Ananya',
    lastName: 'Gupta',
    fullName: 'Ananya Gupta',
    roleName: 'HR',
    roleCode: 'HR',
    status: 'Active',
    departmentId: 1,
    departmentName: 'HR'
  },
  {
    empId: 2,
    employeeId: 2,
    employeeCode: 'EEPZ-DH-001',
    firstName: 'Vikram',
    lastName: 'Patel',
    fullName: 'Vikram Patel',
    roleName: 'Department Head',
    roleCode: 'DH',
    status: 'Active',
    departmentId: 2,
    departmentName: 'Development'
  },
  {
    empId: 3,
    employeeId: 3,
    employeeCode: 'EEPZ-MGR-001',
    firstName: 'Arjun',
    lastName: 'Verma',
    fullName: 'Arjun Verma',
    roleName: 'Manager',
    roleCode: 'MGR',
    status: 'Active',
    departmentId: 2,
    departmentName: 'Development'
  },
  {
    empId: 4,
    employeeId: 4,
    employeeCode: 'EEPZ-MGR-002',
    firstName: 'Priya',
    lastName: 'Singh',
    fullName: 'Priya Singh',
    roleName: 'Manager',
    roleCode: 'MGR',
    status: 'Active',
    departmentId: 3,
    departmentName: 'Design'
  },
  {
    empId: 6,
    employeeId: 6,
    employeeCode: 'EEPZ-EMP-001',
    firstName: 'Neha',
    lastName: 'Sinha',
    fullName: 'Neha Sinha',
    roleName: 'Employee',
    roleCode: 'EMP',
    status: 'Active',
    departmentId: 2,
    departmentName: 'Development'
  },
  {
    empId: 10,
    employeeId: 10,
    employeeCode: 'EEPZ-EMP-002',
    firstName: 'Rahul',
    lastName: 'Kumar',
    fullName: 'Rahul Kumar',
    roleName: 'Employee',
    roleCode: 'EMP',
    status: 'Active',
    departmentId: 3,
    departmentName: 'Design'
  }
];

const MockLogin = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(users[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('🔐 Logging in as:', selected.fullName, `(${selected.roleName})`);
    localStorage.setItem('user', JSON.stringify(selected));
    localStorage.setItem('token', 'MOCK_TOKEN_' + selected.empId);
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        width: '100%',
        padding: '2rem'
      }}>
        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            backgroundColor: '#667eea',
            borderRadius: '50%',
            marginBottom: '1rem'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', fontWeight: 'bold', color: '#27235c' }}>
            EEPZ SLA
          </h2>
          <p style={{ margin: 0, color: '#666', fontSize: '0.875rem' }}>
            Mock Login - Select a user to demo
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* USER GRID */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#333' }}>
              Select User (6 users available)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '0.75rem'
            }}>
              {users.map(user => (
                <button
                  key={user.empId}
                  type="button"
                  onClick={() => setSelected(user)}
                  style={{
                    padding: '0.875rem',
                    border: selected.empId === user.empId ? '2px solid #667eea' : '1px solid #e0e0e0',
                    backgroundColor: selected.empId === user.empId ? '#f0f4ff' : 'white',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selected.empId !== user.empId) {
                      e.target.style.borderColor = '#667eea';
                      e.target.style.backgroundColor = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selected.empId !== user.empId) {
                      e.target.style.borderColor = '#e0e0e0';
                      e.target.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#27235c', marginBottom: '0.25rem' }}>
                    {user.firstName}
                  </div>
                  <small style={{ color: '#999', fontSize: '0.7rem', display: 'block', marginBottom: '0.25rem' }}>
                    {user.roleCode}
                  </small>
                  <small style={{ color: '#667eea', fontSize: '0.7rem', fontWeight: '500' }}>
                    {user.employeeCode}
                  </small>
                </button>
              ))}
            </div>
          </div>

          {/* SELECTED USER INFO */}
          <div style={{
            backgroundColor: '#f5f5f5',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem'
          }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <small style={{ color: '#666', display: 'block', marginBottom: '0.25rem' }}>Currently Selected</small>
              <strong style={{ fontSize: '1.1rem', color: '#27235c' }}>{selected.fullName}</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem' }}>
              <div>
                <small style={{ color: '#999' }}>Role:</small>
                <div style={{ fontWeight: '600', color: '#667eea' }}>{selected.roleName}</div>
              </div>
              <div>
                <small style={{ color: '#999' }}>Department:</small>
                <div style={{ fontWeight: '600', color: '#27235c' }}>{selected.departmentName}</div>
              </div>
              <div>
                <small style={{ color: '#999' }}>Code:</small>
                <div style={{ fontWeight: '500', color: '#666' }}>{selected.employeeCode}</div>
              </div>
              <div>
                <small style={{ color: '#999' }}>Status:</small>
                <div style={{ fontWeight: '600', color: '#24A148' }}>{selected.status}</div>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            <LogIn size={18} />
            Login as {selected.firstName}
          </button>

          <p style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.75rem',
            color: '#999'
          }}>
            🔐 Demo login - No authentication required
          </p>
        </form>
      </div>
    </div>
  );
};

export default MockLogin;
