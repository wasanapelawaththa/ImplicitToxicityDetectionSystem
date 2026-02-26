
export interface User {
  user_id: string;
  user_email: string;
  name: string;
  user_password?: string;
  user_mobile: string;
  gender?: string;
  location?: string;
  profile_pic?: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  gender: string;
  location: string;
}

export interface Post {
  post_id: string;
  p_user_id: string;
  post_desc: string;
  p_content_created_time: string;
  author_name: string;
  is_toxic?: boolean;
}

export interface Comment {
  comment_id: string;
  post_id: string;
  c_user_id: string;
  comment_text: string;
  c_content_created_time: string;
  author_name: string;
  is_toxic?: boolean;
}

export interface Follow {
  follower_id: string;
  followee_id: string;
  following_started_time: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  is_read: boolean;
}
