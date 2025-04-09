// Refactored the User model to match the database schema for testing purposes

export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  g_number: string;
  verified: boolean;
  avatar?: string;
  rating: number;
  joinedAt: Date;
  bio?: string;
}

export const mockUsers: User[] = [
  {
    user_id: "1",
    first_name: "John",
    last_name: "Smith",
    email: "jsmith@gram.edu",
    g_number: "G00123456",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=1",
    rating: 4.8,
    joinedAt: new Date(2023, 8, 1),
    bio: "Junior majoring in Computer Science. I love programming and basketball!",
  },
  {
    user_id: "2",
    first_name: "Taylor",
    last_name: "Johnson",
    email: "tjohnson@gram.edu",
    g_number: "G00789012",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=2",
    rating: 4.5,
    joinedAt: new Date(2022, 7, 15),
    bio: "Senior in Business Administration. Campus ambassador for several brands.",
  },
  {
    user_id: "3",
    first_name: "Alex",
    last_name: "Washington",
    email: "awash@gram.edu",
    g_number: "G00345678",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 4.9,
    joinedAt: new Date(2023, 1, 10),
    bio: "Sophomore studying Biology. Research assistant in the science department.",
  },
];
