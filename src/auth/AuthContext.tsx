import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from '../firebase-config';

interface AuthContextType {
  user: any | null;
  employeeData: any | null;
  isLoading: boolean;
  isRestoringSession: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  employeeData: null,
  isLoading: true,
  isRestoringSession: true,
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [employeeData, setEmployeeData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          // If Admin
          if (currentUser.uid === "l2JP5nnzVSP6gd8aSDEqI60Tbfl2") {
            setEmployeeData({ role: 'ADMIN', isAdmin: true });
          } else {
            const doc = await firebase.firestore().collection('employees').doc(currentUser.uid).get();
            if (doc.exists) {
              setEmployeeData(doc.data());
            } else {
              setEmployeeData(null);
            }
          }
        } catch (e) {
          console.error("AuthContext: Error fetching employee data", e);
        }
      } else {
        setEmployeeData(null);
      }

      setIsLoading(false);
      setIsRestoringSession(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    await firebase.auth().signOut();
  };

  return (
    <AuthContext.Provider value={{ user, employeeData, isLoading, isRestoringSession, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
