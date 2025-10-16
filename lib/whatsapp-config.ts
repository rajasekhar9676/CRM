// WhatsApp Configuration
// Update these values to change the WhatsApp contact details

export const WHATSAPP_CONFIG = {
  // Phone number (without country code, will be automatically formatted)
  phoneNumber: "1234567890",
  
  // Default message that will be pre-filled
  defaultMessage: "Hello! I need help with MiniCRM.",
  
  // Whether to show the floating button
  enabled: true,
  
  // Position settings
  position: {
    bottom: "24px", // 6 * 4px = 24px
    right: "24px",  // 6 * 4px = 24px
  },
  
  // Animation settings
  animations: {
    pulse: true,
    hover: true,
    tooltip: true,
  }
} as const;

// Helper function to format phone number
export function formatPhoneNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it already has country code, return as is
  if (cleaned.startsWith('91')) {
    return cleaned;
  }
  
  // Add Indian country code (91) if not present
  return `91${cleaned}`;
}

// Helper function to create WhatsApp URL
export function createWhatsAppURL(phoneNumber: string, message: string): string {
  const formattedNumber = formatPhoneNumber(phoneNumber);
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}
