import { FileX } from 'lucide-react';
import styles from "../../../styles/lnd/components/EmptyState.module.css";

const EmptyState = ({ 
  icon: Icon = FileX, 
  title = 'No Data Found', 
  message = 'There are no items to display at the moment.',
  action = null 
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.iconContainer}>
        <Icon size={40} color="#6c757d" />
      </div>
      <h5 className={styles.title}>
        {title}
      </h5>
      <p className={`${styles.message} ${action ? '' : styles.messageNoAction}`}>
        {message}
      </p>
      {action && action}
    </div>
  );
};

export default EmptyState;
