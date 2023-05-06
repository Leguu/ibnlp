import { RequestOptions, useRequests } from '@/utils/http';
import { ApiChatRequest, ApiInviteUserRequest, ApiStatsRequest } from './types/controllers';
import { User, UserChatRequest } from './types/model';
import { useCallback } from 'react';

export const useApi = () => {
  const { get, post, stream, deleteRequest } = useRequests();

  const streamChat = (request: ApiChatRequest, options?: RequestOptions<string>) => {
    return stream('/chat', request, options);
  };

  const getMe = useCallback((options?: RequestOptions<User>) => get('/me', undefined, options), [get]);

  const getStats = useCallback((data: ApiStatsRequest, options?: RequestOptions<UserChatRequest[]>) => get('/stats?', data, options), [get]);

  const getUsers = useCallback((options?: RequestOptions<User[]>) => get('/admin/users', undefined, options), [get]);

  const inviteUser = useCallback((inviteRequest: ApiInviteUserRequest, options?: RequestOptions<User[]>) => post('/admin/users/invite', inviteRequest, options), [post]);

  const deleteUser = useCallback((id: string, options?: RequestOptions<User[]>) => deleteRequest(`/admin/users/${id}`, undefined, options), [deleteRequest]);

  const logout = useCallback((options?: RequestOptions<void>) => get('/logout', undefined, options), [get]);

  return { streamChat, getMe, getStats, getUsers, logout, inviteUser, deleteUser };
};