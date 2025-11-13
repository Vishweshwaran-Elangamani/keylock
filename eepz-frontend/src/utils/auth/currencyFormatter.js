/**
 * Smart Currency Formatter
 * Converts amounts to K, L, Cr format
 * 
 * Examples:
 * 100 → ₹100
 * 1000 → ₹1K
 * 100000 → ₹1L
 * 1000000 → ₹10L
 * 10000000 → ₹1Cr
 */

export const formatCurrency = (amount) => {
    if (!amount || amount === 0) return "₹0";
    
    amount = parseFloat(amount);
    
    // Crore (1 crore = 10,000,000)
    if (amount >= 10000000) {
      const crores = amount / 10000000;
      return `₹${crores % 1 === 0 ? crores : crores.toFixed(2)}Cr`;
    }
    
    // Lakh (1 lakh = 100,000)
    if (amount >= 100000) {
      const lakhs = amount / 100000;
      return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(2)}L`;
    }
    
    // Thousand (1 thousand = 1,000)
    if (amount >= 1000) {
      const thousands = amount / 1000;
      return `₹${thousands % 1 === 0 ? thousands : thousands.toFixed(2)}K`;
    }
    
    // Less than 1000 - show as is
    return `₹${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
  };
  
  /**
   * Format currency without symbol (for calculations)
   */
  export const formatCurrencyValue = (amount) => {
    if (!amount || amount === 0) return "0";
    
    amount = parseFloat(amount);
    
    if (amount >= 10000000) {
      const crores = amount / 10000000;
      return `${crores % 1 === 0 ? crores : crores.toFixed(2)}Cr`;
    }
    
    if (amount >= 100000) {
      const lakhs = amount / 100000;
      return `${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(2)}L`;
    }
    
    if (amount >= 1000) {
      const thousands = amount / 1000;
      return `${thousands % 1 === 0 ? thousands : thousands.toFixed(2)}K`;
    }
    
    return `${amount % 1 === 0 ? amount : amount.toFixed(2)}`;
  };
  