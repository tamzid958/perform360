export interface TeamWithMembers {
  id: string;
  name: string;
  description: string | null;
  companyId: string;
  createdAt: Date;
  members: TeamMemberWithUser[];
  _count?: {
    members: number;
  };
}

export interface TeamMemberWithUser {
  id: string;
  userId: string;
  teamId: string;
  role: "MANAGER" | "MEMBER";
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    role: "ADMIN" | "HR" | "EMPLOYEE";
  };
}
