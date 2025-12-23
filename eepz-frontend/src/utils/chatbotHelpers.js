// Generate unique session ID
export const generateSessionId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `session-${timestamp}-${random}`;
};

// Format timestamp
export const formatTimestamp = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffMs = now - messageDate;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Quick question presets
export const quickQuestions = [
    '👋 Hello',
    '❓ Help',
    '👥 List users',
    '📝 Change requests',
    '🎯 List roles',
    '🏢 List departments',
    '📤 Export users',
];

// Parse markdown-style formatting (basic)
export const formatMessage = (text) => {
    // Bold: **text** or __text__
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    
    return text;
};

// Storage keys
export const STORAGE_KEYS = {
    SESSION_ID: 'chatbot_session_id',
    CHAT_OPEN: 'chatbot_is_open',
};
