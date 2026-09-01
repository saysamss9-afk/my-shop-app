import { useState, useCallback } from 'react';
import { AuthRepository } from '../repositories/AuthRepository';

const authRepository = new AuthRepository();

export interface AuthState {
  isLoading: boolean;
  error: string | null;
  user: any | null;
  isSuccess: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    isLoading: false,
    error: null,
    user: authRepository.getCurrentUser(),
    isSuccess: false,
  });

  const login = useCallback(async (email: string, pass: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authRepository.login(email, pass);
      setState({
        isLoading: false,
        error: null,
        user: result.user,
        isSuccess: true,
      });
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message }));
    }
  }, []);

  const register = useCallback(async (email: string, pass: string, shopId?: string, role?: string, name?: string, phoneNumber?: string, ghanaCard?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await authRepository.signUp(email, pass);
      if (shopId && role && name && phoneNumber) {
        await authRepository.linkUserToShop(result.user.uid, email, shopId, role, name, phoneNumber, ghanaCard);
      }
      setState({
        isLoading: false,
        error: null,
        user: result.user,
        isSuccess: true,
      });
    } catch (e: any) {
      setState(prev => ({ ...prev, isLoading: false, error: e.message }));
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const getUserEmployeeData = useCallback(async (uid: string) => {
    return await authRepository.getUserEmployeeData(uid);
  }, []);

  const logout = useCallback(async () => {
    await authRepository.logout();
    setState({
        isLoading: false,
        error: null,
        user: null,
        isSuccess: false,
    });
  }, []);

  const linkUserToShop = useCallback(async (uid: string, email: string, shopId: string, role: string, name: string, phoneNumber: string, ghanaCard?: string) => {
    return await authRepository.linkUserToShop(uid, email, shopId, role, name, phoneNumber, ghanaCard);
  }, []);

  return {
    ...state,
    login,
    register,
    linkUserToShop,
    clearError,
    getUserEmployeeData,
    logout
  };
};
