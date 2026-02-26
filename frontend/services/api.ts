
import { User, Post, Comment, UserProfile } from '../types';

// The URL of  local Node.js server
const API_BASE_URL = 'http://localhost:5000/api';

export class ModerationError extends Error {
  label?: string;
  score?: number;

  constructor(message: string, label?: string, score?: number) {
    super(message);
    this.name = "ModerationError";
    this.label = label;
    this.score = score;
  }
}

/**
 * ApiService bridges the frontend React code and the Backend Node.js code.
 * All functions here use the 'fetch' API to send HTTP requests.
 */
export const ApiService = {
  // Authentication
  login: async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid credentials');
    }
    return response.json();
  },

  signup: async (userData: any): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create account');
    }
  },

  resendVerification: async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to resend verification email');
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send reset link');
    }
  },

  validateResetToken: async (token: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset/validate/${token}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Reset link is invalid or expired.');
    }
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to reset password');
    }
  },

  changePassword: async (userId: string, oldPassword: string, newPassword: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update password');
    }
  },

  deleteAccount: async (userId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/user/${userId}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete account');
    }
  },

  fetchAllUsers: async (excludeUserId?: string): Promise<User[]> => {
    const query = excludeUserId ? `?excludeUserId=${encodeURIComponent(excludeUserId)}` : '';
    const response = await fetch(`${API_BASE_URL}/users${query}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }
    return response.json();
  },

  fetchUserProfile: async (userId: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch user profile');
    }
    return response.json();
  },

  fetchFollowers: async (userId: string): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/follows/followers/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch followers');
    }
    return response.json();
  },

  fetchFollowing: async (userId: string): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/follows/following/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch following');
    }
    return response.json();
  },

  followUser: async (followerId: string, followeeId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/follows`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId, followee_id: followeeId })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to follow user');
    }
  },

  unfollowUser: async (followerId: string, followeeId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/follows`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ follower_id: followerId, followee_id: followeeId })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unfollow user');
    }
  },

  fetchUserProfileDetails: async (userId: string): Promise<UserProfile> => {
    const response = await fetch(`${API_BASE_URL}/profile/${userId}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch profile');
    }
    return response.json();
  },

  updateUserProfileDetails: async (userId: string, profile: UserProfile, agreeTerms: boolean): Promise<UserProfile> => {
    const updateResponse = await fetch(`${API_BASE_URL}/profile/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...profile, agreeTerms })
    });
    if (!updateResponse.ok) {
      const errorData = await updateResponse.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    return updateResponse.json();
  },

  // Posts
  fetchPosts: async (): Promise<Post[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        if (!response.ok) throw new Error('Failed to fetch posts');
        return response.json();
    } catch (err) {
        console.warn("Backend not reached, using local storage/dummy fallback might be needed.");
        throw err;
    }
  },

  createPost: async (postData: Partial<Post>): Promise<{ ok: true; post: Post } | { ok: false; blocked: true; label: string; score: number; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });

    if (response.status === 403) {
      const data = await response.json();
      return { ok: false, blocked: true, label: data.label, score: data.score, message: data.message || "Blocked" };
    }

    if (!response.ok) {
      throw new Error('Failed to create post');
    }

    const post = await response.json();
    return { ok: true, post };
  },


  updatePost: async (postId: string, post_desc: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_desc })
    });

    if (response.status === 403) {
      const data = await response.json();
      throw new ModerationError(data.message || "Blocked", data.label, data.score);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({} as any));
      throw new Error(errorData.error || 'Failed to update post');
    }
  },

  deletePost: async (postId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete post');
  },

  // Comments
  fetchComments: async (postId: string): Promise<Comment[]> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`);
    if (!response.ok) return [];
    return response.json();
  },

  addComment: async (commentData: Partial<Comment>): Promise<{ ok: true; comment: Comment } | { ok: false; blocked: true; label: string; score: number; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commentData),
    });

    if (response.status === 403) {
      const data = await response.json();
      return { ok: false, blocked: true, label: data.label, score: data.score, message: data.message || "Blocked" };
    }

    if (!response.ok) {
      throw new Error('Failed to add comment');
    }

    const comment = await response.json();
    return { ok: true, comment };
  },

updateComment: async (commentId: string, comment_text: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment_text })
  });

  if (response.status === 403) {
    const data = await response.json();
    throw new ModerationError(data.message || "Blocked", data.label, data.score);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({} as any));
    throw new Error(errorData.error || 'Failed to update comment');
  }
},
}
