export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  organization: {
    id: string;
    name: string;
    type: 'admin_faculty' | 'official_student' | 'general';
    verified: boolean;
  };
  creator: {
    first_name: string;
    last_name: string;
  };
  image_url?: string;
  created_at: Date;
}

// Map organization types to priorities for sorting
export const organizationPriority = {
  'admin_faculty': 1,
  'official_student': 2,
  'general': 3
};

// Map organization types to display names
export const organizationTypeNames = {
  'admin_faculty': 'Faculty/Admin',
  'official_student': 'Official Student Organization',
  'general': 'Club/Group'
};

export const eventCategories = [
  "Academic",
  "Athletics",
  "Cultural",
  "Social",
  "Career",
  "Club",
  "Other",
];
