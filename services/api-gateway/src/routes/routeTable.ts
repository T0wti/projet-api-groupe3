import { Role } from '../utils/roles';
import { ServiceName } from '../config/env';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteRule {
  method: HttpMethod;
  path: string;
  target: ServiceName;
  auth: 'public' | 'required';
  roles?: Role[];
  selfParam?: string;
  bypassRoles?: Role[];
}

export const routeTable: RouteRule[] = [
  // Auth
  { method: 'post', path: '/api/auth/register', target: 'auth', auth: 'public' },
  { method: 'post', path: '/api/auth/login', target: 'auth', auth: 'public' },
  { method: 'post', path: '/api/auth/refresh', target: 'auth', auth: 'public' },
  { method: 'post', path: '/api/auth/logout', target: 'auth', auth: 'public' },
  { method: 'get', path: '/api/auth/verify', target: 'auth', auth: 'public' },

  // Users
  { method: 'get', path: '/api/users/:id', target: 'user', auth: 'required' },
  { method: 'put', path: '/api/users/:id', target: 'user', auth: 'required', selfParam: 'id', bypassRoles: ['admin'] },
  { method: 'delete', path: '/api/users/:id', target: 'user', auth: 'required', selfParam: 'id', bypassRoles: ['admin'] },
  //{ method: 'patch', path: '/api/users/:id/ban', target: 'user', auth: 'required', roles: ['admin'] },
  { method: 'patch', path: '/api/users/:id/role', target: 'user', auth: 'required', roles: ['admin'] },

  // Posts
  { method: 'post', path: '/api/posts', target: 'post', auth: 'required' },
  { method: 'get', path: '/api/posts', target: 'post', auth: 'required' },
  { method: 'get', path: '/api/posts/:id', target: 'post', auth: 'required' },
  { method: 'get', path: '/api/posts/:id/replies', target: 'post', auth: 'required' },
  { method: 'put', path: '/api/posts/:id', target: 'post', auth: 'required' },
  { method: 'delete', path: '/api/posts/:id', target: 'post', auth: 'required' },

  // Profile
  { method: 'post', path: '/api/profile/follow', target: 'profil', auth: 'required' },
  { method: 'delete', path: '/api/profile/follow', target: 'profil', auth: 'required' },
  { method: 'post', path: '/api/profile/likes', target: 'profil', auth: 'required' },
  { method: 'delete', path: '/api/profile/likes', target: 'profil', auth: 'required' },

  { method: 'get', path: '/api/profile/:userId/followers', target: 'profil', auth: 'required' },
  { method: 'get', path: '/api/profile/:userId/following', target: 'profil', auth: 'required' },
  { method: 'get', path: '/api/profile/:userId/likes', target: 'profil', auth: 'required' },

  { method: 'post', path: '/api/profile', target: 'profil', auth: 'required' },
  { method: 'get', path: '/api/profile/:userId', target: 'profil', auth: 'required', selfParam: 'userId', bypassRoles: ['admin'] },
  { method: 'put', path: '/api/profile/:userId', target: 'profil', auth: 'required', selfParam: 'userId', bypassRoles: ['admin'] },
  { method: 'delete', path: '/api/profile/:userId', target: 'profil', auth: 'required', selfParam: 'userId', bypassRoles: ['admin'] },
];
