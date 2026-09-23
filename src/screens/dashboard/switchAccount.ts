export const handleSwitchAccount = async ({
  signOut,
  reset,
}: {
  signOut: () => Promise<void>;
  reset?: (params: any) => void;
}) => {
  try {
    await signOut();
  } catch (e) {
    console.error('Logout error:', e);
  }

  if (typeof reset === 'function') {
    try {
      reset({ index: 0, routes: [{ name: 'Landing' }] });
    } catch (e) {
      console.error('Reset navigation error:', e);
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    window.location.href = '/';
  }
};
