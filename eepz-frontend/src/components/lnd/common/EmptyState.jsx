import { FileX } from 'lucide-react';

const EmptyState = ({ 
  icon: Icon = FileX, 
  title = 'No Data Found', 
  message = 'There are no items to display at the moment.',
  action = null 
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e5e7eb'
      }}
    >
      <div
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem'
        }}
      >
        <Icon size={40} color="#6c757d" />
      </div>
      <h5
        style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#212529',
          marginBottom: '0.5rem'
        }}
      >
        {title}
      </h5>
      <p
        style={{
          fontSize: '0.875rem',
          color: '#6c757d',
          marginBottom: action ? '1.5rem' : '0',
          maxWidth: '400px'
        }}
      >
        {message}
      </p>
      {action && action}
    </div>
  );
};

export default EmptyState;
