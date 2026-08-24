export interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string | null;
}
