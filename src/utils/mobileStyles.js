// Mobile-first responsive style utilities for iOS

export const isMobile = () => {
  return window.innerWidth <= 768;
};

export const responsive = {
  container: {
    padding: isMobile() ? '16px' : '40px 20px',
    paddingTop: isMobile() ? 'max(16px, env(safe-area-inset-top))' : '40px',
    paddingBottom: isMobile() ? 'max(16px, env(safe-area-inset-bottom))' : '20px',
  },

  title: {
    fontSize: isMobile() ? '28px' : '48px',
  },

  subtitle: {
    fontSize: isMobile() ? '16px' : '20px',
  },

  text: {
    fontSize: isMobile() ? '14px' : '16px',
  },

  button: {
    padding: isMobile() ? '14px 24px' : '12px 32px',
    fontSize: isMobile() ? '16px' : '16px',
    minHeight: '44px', // iOS touch target minimum
  },

  touchTarget: {
    minWidth: '44px',
    minHeight: '44px',
  }
};
