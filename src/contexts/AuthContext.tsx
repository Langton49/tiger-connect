import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { User } from "@/models/User";
import { useToast } from "@/hooks/use-toast";
import { supabaseCon } from "@/db_api/connection.js";

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
  makeUserAdmin: (engineeringCode: string) => Promise<boolean>;
  updateLocalUser: (updates: Partial<User>) => boolean;
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
    email: string, // change to email for login because there was no way to securely login without exposing the db to the public
    password: string
  ): Promise<boolean> => {
    // Simulate API call
    try {
      const user = await supabaseCon.login(email, password); // Returns a user object with success and data properties

      // If the login was successful, set the user in state and localStorage
      if (user.success) {
        setCurrentUser(user.data);
        setIsAuthenticated(true);
        localStorage.setItem("tigerUser", JSON.stringify(user.data));
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.data.first_name}!`,
        });
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid email or password",
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

      // If an error occurred while checking for existing user, show error message
      if (existingUser.error) {
        toast({
          title: "Registration Failed",
          description: "Please try again later",
          variant: "destructive",
        });
        return false;
      }

      // If user already exists, message stating that the user already exists
      if (existingUser.exists) {
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
        user_id: signupResult.data.user_id,
        first_name: signupResult.data.first_name,
        last_name: signupResult.data.last_name,
        email: signupResult.data.email,
        g_number: signupResult.data.g_number,
        rating: null,
        verified: signupResult.data.verified,
        joinedAt: signupResult.data.joinedAt,
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

  const logout = async () => {
    const logoutResult = await supabaseCon.logout();

    // Even if logout fails server-side, we'll clear locally for better UX
    setCurrentUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("tigerUser");
  };

  const makeUserAdmin = async (engineeringCode: string): Promise<boolean> => {
    try {
      if (!currentUser?.user_id) {
        toast({
          title: "Error",
          description: "You must be logged in to become an admin",
          variant: "destructive",
        });
        return false;
      }

      // Validate the engineering team code
      // In a real app, this would be more secure, but for this example we use a simple code
      if (engineeringCode !== "TigerConnect2024") {
        toast({
          title: "Invalid Code",
          description: "The engineering team code is incorrect",
          variant: "destructive",
        });
        return false;
      }

      // Make the user an admin in the database
      const result = await supabaseCon.makeUserAdmin(currentUser.user_id);

      if (result.success) {
        // Update the local user state
        const updatedUser = { ...currentUser, is_admin: true };
        setCurrentUser(updatedUser);
        localStorage.setItem("tigerUser", JSON.stringify(updatedUser));

        toast({
          title: "Admin Access Granted",
          description: "You now have administrator privileges",
        });
        return true;
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to grant admin access",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error making user admin:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateLocalUser = (updates: Partial<User>) => {
    console.log("Updating local user:", updates);
    if (!currentUser) {
      console.warn("Cannot update user - no current user");
      return false;
    }

    try {
      const updatedUser = { ...currentUser, ...updates };
      setCurrentUser(updatedUser);
      localStorage.setItem("tigerUser", JSON.stringify(updatedUser));
      console.log(updatedUser);
      return true;
    } catch (error) {
      console.error("Failed to update local user:", error);
      return false;
    }
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
        makeUserAdmin,
        updateLocalUser,
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
