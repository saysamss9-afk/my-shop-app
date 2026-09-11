export const handleSwitchAccount = async ({ signOut, reset }: { signOut: () => Promise<void>; reset: (params: any) => void }) => {
  await signOut();
  reset({ index: 0, routes: [{ name: 'Landing' }] });
};
