import { RequestOptions, useRequests } from '@/utils/http';
import { ApiChatRequest, ApiFeedbackRequest, ApiInviteUserRequest, ApiStatsRequest } from './types/controllers';
import { User, UserChatRequest, UserFeedback } from './types/model';
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

  const addFeedback = useCallback((feedback: ApiFeedbackRequest, options?: RequestOptions<void>) => post('/feedback', feedback, options), [post]);

  const getFeedback = useCallback((options?: RequestOptions<UserFeedback[]>) => get('/feedback', undefined, options), [get]);

  const deleteFeedback = useCallback((id: number, options?: RequestOptions<void>) => deleteRequest(`/feedback/${id}`, undefined, options), [deleteRequest]);

  return { streamChat, getMe, getStats, getUsers, logout, inviteUser, deleteUser, addFeedback, getFeedback, deleteFeedback };
};