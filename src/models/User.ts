
export interface User {
  id: string;
  name: string;
  email: string;
  studentId: string;
  verified: boolean;
  avatar?: string;
  rating: number;
  joinedAt: Date;
  bio?: string;
}

export const mockUsers: User[] = [
  {
    id: "1",
    name: "John Smith",
    email: "jsmith@gram.edu",
    studentId: "G00123456",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=1",
    rating: 4.8,
    joinedAt: new Date(2023, 8, 1),
    bio: "Junior majoring in Computer Science. I love programming and basketball!"
  },
  {
    id: "2",
    name: "Taylor Johnson",
    email: "tjohnson@gram.edu",
    studentId: "G00789012",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=2",
    rating: 4.5,
    joinedAt: new Date(2022, 7, 15),
    bio: "Senior in Business Administration. Campus ambassador for several brands."
  },
  {
    id: "3",
    name: "Alex Washington",
    email: "awash@gram.edu",
    studentId: "G00345678",
    verified: true,
    avatar: "https://i.pravatar.cc/150?img=3",
    rating: 4.9,
    joinedAt: new Date(2023, 1, 10),
    bio: "Sophomore studying Biology. Research assistant in the science department."
  }
];
