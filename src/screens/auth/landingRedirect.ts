export type LandingRedirectState = {
  user: { uid: string } | null;
  employeeData: { shopId?: string; role?: string; isAdmin?: boolean } | null;
  isRestoringSession: boolean;
};

export const resolveLandingRedirect = (state: LandingRedirectState) => {
  const { user, employeeData, isRestoringSession } = state;

  if (isRestoringSession || !user) {
    return null;
  }

  if (user.uid === 'l2JP5nnzVSP6gd8aSDEqI60Tbfl2') {
    return { name: 'AdminDashboard' };
  }

  if (employeeData) {
    return {
      name: 'Dashboard',
      params: {
        shopId: employeeData.shopId,
        employeeId: user.uid,
        userRole: employeeData.role,
        shopName: 'Your Shop',
      },
    };
  }

  return { name: 'ShopSetup' };
};
