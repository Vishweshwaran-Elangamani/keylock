import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';
import { TASK_STATUS, GOAL_STATUS } from '../../constants/goals/goalConstants';

// ==================== DATE FORMATTING ====================
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return 'N/A';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy');
};

export const getRelativeTime = (date) => {
  if (!date) return 'N/A';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'Invalid Date';
  }
};

export const isOverdue = (deadline) => {
  if (!deadline) return false;
  try {
    const parsedDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
    return isBefore(parsedDate, new Date());
  } catch (error) {
    return false;
  }
};

export const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  try {
    const parsedDate = typeof deadline === 'string' ? parseISO(deadline) : deadline;
    const days = Math.ceil((parsedDate - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  } catch (error) {
    return null;
  }
};

// ==================== TASK STATUS ====================
export const getTaskStatus = (progress, hasPendingApproval, isAcknowledged) => {
  if (progress === 0) return TASK_STATUS.NOT_STARTED;
  if (progress === 100 && isAcknowledged) return TASK_STATUS.ACKNOWLEDGED;
  if (progress === 100 && hasPendingApproval) return TASK_STATUS.PENDING_ACKNOWLEDGMENT;
  if (progress > 0 && progress < 100) return TASK_STATUS.IN_PROGRESS;
  return TASK_STATUS.NOT_STARTED;
};

// ==================== PROGRESS CALCULATIONS ====================
export const calculateProgress = (checklist) => {
  if (!checklist || checklist.length === 0) return 0;
  const completed = checklist.filter(item => item.isCompleted || item.completed).length;
  return Math.round((completed / checklist.length) * 100);
};

export const calculateTeamProgress = (assignees) => {
  if (!assignees || assignees.length === 0) return 0;
  const totalProgress = assignees.reduce((sum, assignee) => sum + (assignee.progress || 0), 0);
  return Math.round(totalProgress / assignees.length);
};

// ==================== PERMISSION HELPERS ====================
export const canUserEdit = (goal, currentUser) => {
  if (!goal || !currentUser) return false;
  
  // Creator can edit if goal is not completed
  if (goal.createdBy === currentUser.id && goal.status !== GOAL_STATUS.COMPLETED) {
    return true;
  }
  
  return false;
};

export const canUserAssign = (goal, currentUser) => {
  if (!goal || !currentUser) return false;
  
  // Only team goals can be assigned
  if (goal.type !== 'team') return false;
  
  // Creator can assign
  if (goal.createdBy === currentUser.id) return true;
  
  // Leaders can assign any team goal
  if (currentUser.role === 'Leadership') return true;
  
  return false;
};

export const canUserComment = (goal, currentUser) => {
  if (!goal || !currentUser) return false;
  
  // Creator can always comment
  if (goal.createdBy === currentUser.id) return true;
  
  // Assignees can comment
  if (goal.assignees && goal.assignees.some(a => a.employeeMasterId === currentUser.id)) {
    return true;
  }
  
  // Managers and leaders can comment on any goal
  if (['Manager', 'Department Head', 'Leadership'].includes(currentUser.role)) {
    return true;
  }
  
  return false;
};

// ==================== FILTERING HELPERS ====================
export const filterGoals = (goals, filters) => {
  if (!goals) return [];
  
  return goals.filter(goal => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        goal.title?.toLowerCase().includes(searchLower) ||
        goal.description?.toLowerCase().includes(searchLower) ||
        goal.creatorName?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && goal.status !== filters.status) {
      return false;
    }
    
    // Project filter
    if (filters.projectId && goal.projectId !== filters.projectId) {
      return false;
    }
    
    // Creator filter
    if (filters.creatorId && goal.createdBy !== filters.creatorId) {
      return false;
    }
    
    // Date range filter
    if (filters.dateFrom && isBefore(parseISO(goal.createdOn), parseISO(filters.dateFrom))) {
      return false;
    }
    if (filters.dateTo && isAfter(parseISO(goal.createdOn), parseISO(filters.dateTo))) {
      return false;
    }
    
    return true;
  });
};

// ==================== SORTING HELPERS ====================
export const sortGoals = (goals, sortBy = 'createdOn', sortOrder = 'desc') => {
  if (!goals) return [];
  
  const sorted = [...goals].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle date sorting
    if (sortBy === 'createdOn' || sortBy === 'deadline') {
      aValue = aValue ? new Date(aValue).getTime() : 0;
      bValue = bValue ? new Date(bValue).getTime() : 0;
    }
    
    // Handle string sorting
    if (typeof aValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Handle number sorting
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });
  
  return sorted;
};

// ==================== VALIDATION HELPERS ====================
export const validateGoalForm = (formData) => {
  const errors = [];
  
  if (!formData.title || formData.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (!formData.type) {
    errors.push('Goal type is required');
  }
  
  if (!formData.deadline) {
    errors.push('Deadline is required');
  } else if (isBefore(parseISO(formData.deadline), new Date())) {
    errors.push('Deadline must be in the future');
  }
  
  if (!formData.checklist || formData.checklist.length < 3) {
    errors.push('At least 3 checklist items are required');
  }
  
  // Validate all checklist items are assigned
  if (formData.checklist) {
    const unassigned = formData.checklist.filter(item => !item.assignedTo);
    if (unassigned.length > 0) {
      errors.push(`${unassigned.length} checklist item(s) not assigned`);
    }
  }
  
  // Team goals must have assignees
  if (formData.type === 'team' && (!formData.assignees || formData.assignees.length === 0)) {
    errors.push('Team goals must have at least one assignee');
  }
  
  return errors;
};

// ==================== USER INITIALS ====================
export const getInitials = (name) => {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// ==================== TRUNCATE TEXT ====================
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
