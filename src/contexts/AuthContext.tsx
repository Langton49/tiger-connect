import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { User, mockUsers } from "@/models/User";
import { useToast } from "@/hooks/use-toast";
import { supabaseCon } from "../db_api/connection.js";

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (studentId: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    studentId: string,
    password: string
  ) => Promise<boolean>;
  logout: () => void;
  verifyAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { toast } = useToast();

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("tigerUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("tigerUser");
      }
    }
  }, []);

  const login = async (
    studentId: string,
    password: string
  ): Promise<boolean> => {
    // Simulate API call
    try {
      // For demo purposes, we'll just use mock data
      // In a real app, this would call your authentication API
      const user = mockUsers.find((u) => u.studentId === studentId);

      if (user && password === "password") {
        // In a real app, use proper password validation
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem("tigerUser", JSON.stringify(user));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid student ID or password",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Login error", error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    studentId: string,
    password: string
  ): Promise<boolean> => {
    // Simulate API call
    try {
      // Check if user already exists
      const existingUser = await supabaseCon.userExists(studentId);

      if (existingUser) {
        toast({
          title: "Registration Failed",
          description: "Student ID or email already in use",
          variant: "destructive",
        });
        return false;
      }

      // Simple split to split the full name into first and last names
      const parts = name.split(/\s+/);

      // Call SupabaseDbConnection's signup method
      const signupResult = await supabaseCon.signup(
        parts[0],
        parts[1],
        email,
        studentId,
        password
      );

      if (!signupResult.success) {
        toast({
          title: "Registration Failed",
          description: signupResult.error || "An unexpected error occurred.",
          variant: "destructive",
        });
        return false;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        studentId,
        verified: false,
        rating: 0,
        joinedAt: new Date(),
      };

      // Auto-login the new user
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem("tigerUser", JSON.stringify(newUser));

      toast({
        title: "Registration Successful",
        description:
          "Your account has been created. Please verify your student ID.",
      });

      return true;
    } catch (error) {
      console.error("Registration error", error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const verifyAccount = async (): Promise<boolean> => {
    // Simulate API call for verification
    try {
      if (!currentUser) return false;

      // In a real app, this would call your verification API
      const updatedUser = { ...currentUser, verified: true };
      setCurrentUser(updatedUser);
      localStorage.setItem("tigerUser", JSON.stringify(updatedUser));

      toast({
        title: "Verification Successful",
        description: "Your student ID has been verified!",
      });

      return true;
    } catch (error) {
      console.error("Verification error", error);
      toast({
        title: "Verification Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("tigerUser");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        login,
        register,
        logout,
        verifyAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
