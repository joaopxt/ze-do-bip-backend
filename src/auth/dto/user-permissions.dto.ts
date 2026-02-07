export class UserPermissionsResponseDto {
  codoper: string;
  role: {
    id: number;
    name: string;
    description: string;
  } | null;
  permissions: {
    id: number;
    name: string;
    description: string;
    module: string;
    source: 'role' | 'custom';
  }[];
  modules: string[];
}
