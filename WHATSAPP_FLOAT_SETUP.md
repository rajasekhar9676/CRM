# WhatsApp Floating Button Setup

## Overview

A floating WhatsApp button has been added to your MiniCRM application that appears on every page in the bottom-right corner. Users can click it to open WhatsApp with a pre-filled message.

## Features

✅ **Always Visible**: Appears on every page
✅ **Responsive Design**: Works on desktop and mobile
✅ **Animations**: Pulse effect and hover animations
✅ **Tooltip**: Shows helpful text on hover
✅ **Customizable**: Easy to change phone number and message
✅ **Close Button**: Users can hide the button if needed
✅ **Auto-formatting**: Automatically adds country code (91 for India)

## Files Added

1. **`components/ui/whatsapp-float.tsx`** - Main WhatsApp button component
2. **`lib/whatsapp-config.ts`** - Configuration file for easy customization
3. **`app/layout.tsx`** - Updated to include the WhatsApp button
4. **`WHATSAPP_FLOAT_SETUP.md`** - This documentation file

## How to Customize

### 1. Change Phone Number

Edit `lib/whatsapp-config.ts`:

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "9876543210", // Change this to your WhatsApp number
  defaultMessage: "Hello! I need help with MiniCRM.",
  // ... other settings
};
```

### 2. Change Default Message

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "1234567890",
  defaultMessage: "Hi! I'm interested in your services.", // Change this
  // ... other settings
};
```

### 3. Disable the Button

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "1234567890",
  defaultMessage: "Hello! I need help with MiniCRM.",
  enabled: false, // Set to false to hide the button
  // ... other settings
};
```

### 4. Change Position

```typescript
export const WHATSAPP_CONFIG = {
  // ... other settings
  position: {
    bottom: "32px", // Distance from bottom
    right: "32px",  // Distance from right
  },
};
```

### 5. Disable Animations

```typescript
export const WHATSAPP_CONFIG = {
  // ... other settings
  animations: {
    pulse: false,    // Disable pulse animation
    hover: false,    // Disable hover effects
    tooltip: false,  // Disable tooltip
  }
};
```

## Phone Number Format

The system automatically handles phone number formatting:

- **Input**: `1234567890` or `+91 1234567890` or `+91-1234567890`
- **Output**: `911234567890` (WhatsApp format)

### Examples:

| Input | Formatted Output | WhatsApp URL |
|-------|------------------|--------------|
| `1234567890` | `911234567890` | `https://wa.me/911234567890` |
| `+91 9876543210` | `919876543210` | `https://wa.me/919876543210` |
| `+91-9876543210` | `919876543210` | `https://wa.me/919876543210` |

## How It Works

1. **Button Display**: The button appears in the bottom-right corner of every page
2. **Click Action**: When clicked, it opens WhatsApp Web/App with your number
3. **Pre-filled Message**: The default message is automatically filled in
4. **New Tab**: Opens in a new tab/window so users don't lose their place
5. **Mobile Friendly**: Works on both desktop and mobile devices

## Styling

The button uses Tailwind CSS classes and includes:

- **Green Background**: `bg-green-500` (WhatsApp brand color)
- **Hover Effects**: Scale and shadow animations
- **Pulse Animation**: Subtle pulsing effect to draw attention
- **Online Indicator**: Small green dot showing "online" status
- **Tooltip**: Appears on hover with helpful text

## Browser Support

- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Testing

1. **Desktop**: Click the button and verify WhatsApp Web opens
2. **Mobile**: Click the button and verify WhatsApp App opens
3. **Different Numbers**: Test with various phone number formats
4. **Custom Messages**: Test with different default messages

## Troubleshooting

### Button Not Appearing

1. Check if `enabled: true` in `whatsapp-config.ts`
2. Verify the component is imported in `layout.tsx`
3. Check browser console for errors

### WhatsApp Not Opening

1. Verify phone number format is correct
2. Check if WhatsApp is installed on mobile
3. Test with different browsers

### Styling Issues

1. Check if Tailwind CSS is properly configured
2. Verify all CSS classes are available
3. Check for conflicting styles

## Customization Examples

### Example 1: Business Support

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "9876543210",
  defaultMessage: "Hi! I need support with my MiniCRM account.",
  enabled: true,
};
```

### Example 2: Sales Inquiry

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "9876543210",
  defaultMessage: "Hello! I'm interested in your MiniCRM services. Can you tell me more?",
  enabled: true,
};
```

### Example 3: Different Position

```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: "9876543210",
  defaultMessage: "Hello! I need help with MiniCRM.",
  position: {
    bottom: "100px", // Higher up
    right: "20px",   // Closer to edge
  },
};
```

## Security Notes

- Phone numbers are not stored in cookies or local storage
- No tracking or analytics on button clicks
- WhatsApp URLs are generated client-side only
- No personal data is collected

## Future Enhancements

Potential improvements you could add:

1. **Multiple Numbers**: Support for different departments
2. **Time-based Messages**: Different messages based on time of day
3. **User-specific Messages**: Messages based on user's current page
4. **Analytics**: Track how many users click the button
5. **A/B Testing**: Test different messages and positions

## Support

If you need help customizing the WhatsApp button:

1. Check this documentation first
2. Look at the configuration file: `lib/whatsapp-config.ts`
3. Check the component file: `components/ui/whatsapp-float.tsx`
4. Test changes in development mode first

---

**Note**: The current phone number is set to `1234567890` as requested. Update it in `lib/whatsapp-config.ts` when you're ready to use your real WhatsApp number.
