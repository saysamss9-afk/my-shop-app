export const NetInfo = {
  addEventListener: (fn: any) => {
    const handler = () => fn({ isConnected: navigator.onLine, isInternetReachable: navigator.onLine });
    window.addEventListener('online', handler);
    window.addEventListener('offline', handler);
    return () => {
      window.removeEventListener('online', handler);
      window.removeEventListener('offline', handler);
    };
  },
  fetch: async () => ({ isConnected: navigator.onLine, isInternetReachable: navigator.onLine }),
};

export default NetInfo;
