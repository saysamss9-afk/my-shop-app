import { resolveLandingRedirect } from './landingRedirect';

describe('resolveLandingRedirect', () => {
  it('returns null when no user is signed in', () => {
    expect(resolveLandingRedirect({ user: null, employeeData: null, isRestoringSession: false })).toBeNull();
  });

  it('routes the admin user to the admin dashboard', () => {
    const result = resolveLandingRedirect({
      user: { uid: 'l2JP5nnzVSP6gd8aSDEqI60Tbfl2' },
      employeeData: { role: 'ADMIN', isAdmin: true },
      isRestoringSession: false,
    });

    expect(result).toEqual({ name: 'AdminDashboard' });
  });

  it('routes a shop employee to their dashboard', () => {
    const result = resolveLandingRedirect({
      user: { uid: 'employee-123' },
      employeeData: { shopId: 'shop-1', role: 'MANAGER' },
      isRestoringSession: false,
    });

    expect(result).toEqual({
      name: 'Dashboard',
      params: {
        shopId: 'shop-1',
        employeeId: 'employee-123',
        userRole: 'MANAGER',
        shopName: 'Your Shop',
      },
    });
  });

  it('routes a user without employee data to setup', () => {
    const result = resolveLandingRedirect({
      user: { uid: 'employee-456' },
      employeeData: null,
      isRestoringSession: false,
    });

    expect(result).toEqual({ name: 'ShopSetup' });
  });
});
