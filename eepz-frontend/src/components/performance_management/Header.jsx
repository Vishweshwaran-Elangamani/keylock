
import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Search, Bell, User, KeyRound, LogOut } from 'lucide-react';

const formatDate = (date, locale = navigator.language || 'en-IN') => {

  return new Intl.DateTimeFormat(locale, {

    weekday: 'long',

    month: 'long',

    day: 'numeric',

    year: 'numeric'

  }).format(date);

};

const Header = () => {

  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const today = new Date();

  const formattedDate = formatDate(today);

  // Get user from localStorage (temporary solution)

  const getUserFromStorage = () => {

    const storedUser = localStorage.getItem('user');

    if (storedUser) {

      try {

        return JSON.parse(storedUser);

      } catch (error) {

        return { name: 'User', email: 'user@example.com', empId: 'EMP-000' };

      }

    }

    return { name: 'User', email: 'user@example.com', empId: 'EMP-000' };

  };

  const user = getUserFromStorage();

  const getInitials = (name) => {

    if (!name) return 'U';

    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  };

  const handleLogout = () => {

    if (window.confirm('Are you sure you want to logout?')) {

      localStorage.removeItem('user');

      localStorage.removeItem('token');

      navigate('/login');

    }

  };

  const handleChangePassword = () => {

    localStorage.setItem('tempUser', JSON.stringify(user));

    navigate('/change-password', { state: { user, fromSettings: true } });

    setShowProfileMenu(false);

  };

  const handleProfile = () => {

    navigate('/profile');

    setShowProfileMenu(false);

  };

  return (
<header

      className="bg-white border-bottom"

      style={{

        position: 'sticky',

        top: 0,

        zIndex: 1000,

        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'

      }}
>
<div className="d-flex align-items-center justify-content-between px-4 py-3">

        {/* Left Section - Welcome */}
<div className="d-flex align-items-center gap-3">
<div>
<div className="d-flex align-items-center gap-2">
<i className="bi bi-person-circle" style={{ fontSize: '1.2rem', color: '#97247E' }}></i>
<h6 className="mb-0 fw-bold" style={{ color: 'var(--color-primary-1)' }}>

                Welcome, {user?.name || 'User'}
</h6>
</div>
<small className="text-muted">{formattedDate}</small>
</div>
</div>

        {/* Right Section - Search, Notifications, Profile */}
<div className="d-flex align-items-center gap-3">

          {/* Search Bar */}
<div className="input-group" style={{ width: '300px' }}>
<span className="input-group-text bg-white border-end-0">
<Search size={18} className="text-muted" />
</span>
<input

              type="text"

              className="form-control border-start-0"

              placeholder="Search..."

              aria-label="Search"

              style={{ fontSize: '0.875rem' }}

            />
</div>

          {/* Notification Bell */}
<div className="position-relative">
<button

              className="btn btn-link text-dark p-0 position-relative"

              style={{ textDecoration: 'none' }}
>
<Bell size={24} />
<span

                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"

                style={{ fontSize: '0.65rem', padding: '0.25rem 0.4rem' }}
>

                3
</span>
</button>
</div>

          {/* User Profile Dropdown */}
<div className="dropdown">
<button

              className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold"

              onClick={() => setShowProfileMenu(!showProfileMenu)}

              style={{

                width: '40px',

                height: '40px',

                cursor: 'pointer',

                background: 'linear-gradient(135deg, #AC5098 0%, #97247E 100%)',

                border: 'none',

                boxShadow: '0 2px 8px rgba(151, 36, 126, 0.3)',

                fontSize: '0.875rem',

                letterSpacing: '0.5px'

              }}

              data-bs-toggle="dropdown"

              aria-expanded={showProfileMenu}
>

              {getInitials(user?.name || 'User')}
</button>

            {/* Profile Dropdown Menu */}
<div

              className={`dropdown-menu dropdown-menu-end ${showProfileMenu ? 'show' : ''}`}

              style={{

                minWidth: '320px',

                borderRadius: '12px',

                border: '1px solid #e5e7eb',

                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',

                padding: 0,

                marginTop: '10px'

              }}
>

              {/* Profile Header */}
<div className="p-4 text-center border-bottom">
<div

                  className="rounded-circle text-white d-flex align-items-center justify-content-center fw-bold mx-auto mb-3"

                  style={{

                    width: '72px',

                    height: '72px',

                    background: 'linear-gradient(135deg, #AC5098 0%, #97247E 100%)',

                    border: '4px solid #e5e7eb',

                    fontSize: '1.5rem',

                    boxShadow: '0 4px 12px rgba(151, 36, 126, 0.3)'

                  }}
>

                  {getInitials(user?.name || 'User')}
</div>
<h5 className="fw-bold mb-1" style={{ fontSize: '18px', color: 'var(--color-primary-1)' }}>

                  {user?.name || 'User'}
</h5>
<p className="text-muted mb-2" style={{ fontSize: '14px' }}>

                  {user?.email || 'user@example.com'}
</p>
<p

                  className="fw-bold mb-0"

                  style={{

                    fontSize: '14px',

                    letterSpacing: '0.5px',

                    color: '#97247E'

                  }}
>

                  {user?.empId || 'EMP-000'}
</p>
</div>

              {/* Profile Actions */}
<div className="p-3">
<button

                  className="btn w-100 mb-2 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"

                  onClick={handleProfile}

                  style={{

                    backgroundColor: '#3f4d8f',

                    color: 'white',

                    border: 'none',

                    borderRadius: '8px',

                    fontSize: '14px',

                    transition: 'all 0.2s ease'

                  }}
>
<User size={16} />

                  Profile
</button>
<button

                  className="btn w-100 mb-2 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"

                  onClick={handleChangePassword}

                  style={{

                    backgroundColor: '#3f4d8f',

                    color: 'white',

                    border: 'none',

                    borderRadius: '8px',

                    fontSize: '14px',

                    transition: 'all 0.2s ease'

                  }}
>
<KeyRound size={16} />

                  Change Password
</button>
<button

                  className="btn btn-outline-danger w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"

                  onClick={handleLogout}

                  style={{

                    borderRadius: '8px',

                    fontSize: '14px',

                    transition: 'all 0.2s ease'

                  }}
>
<LogOut size={16} />

                  Logout
</button>
</div>
</div>
</div>
</div>
</div>

      {/* Backdrop for closing dropdown */}

      {showProfileMenu && (
<div

          style={{

            position: 'fixed',

            top: 0,

            left: 0,

            right: 0,

            bottom: 0,

            zIndex: 999

          }}

          onClick={() => setShowProfileMenu(false)}

        />

      )}
</header>

  );

};

export default Header;
 