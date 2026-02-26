import React, { useState, useEffect } from 'react';
import { Page } from '../App';
import { User, Post, Comment } from '../types';
import { Header, Footer } from './Layout';
import { ConfirmModal } from './Modals';
import { ApiService, ModerationError } from '../services/api';

interface DashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  hasNewNotif: boolean;
  onReadNotif: () => void;
  onLogout: () => void;
  onAddNotif: (msg: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, hasNewNotif, onReadNotif, onLogout, onAddNotif }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postText, setPostText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isDeletingPost, setIsDeletingPost] = useState<string | null>(null);
  const [isEditingPost, setIsEditingPost] = useState<string | null>(null);
  const [editPostText, setEditPostText] = useState('');

  useEffect(() => {
    let isMounted = true;
    ApiService.fetchPosts()
      .then(data => {
        if (isMounted) setPosts(data);
      })
      .catch(() => {
        if (isMounted) setErrorMsg('Failed to load posts.');
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // ✅ CREATE POST (backend moderation)
  const handleCreatePost = async () => {
    if (!postText.trim()) {
      setErrorMsg('Fill the required field with valid data');
      return;
    }
    if (postText.length > 500) {
      setErrorMsg('Post exceeds the maximum size.');
      return;
    }

  try {
    const result = await ApiService.createPost({
      p_user_id: user.user_id,
      post_desc: postText,
      author_name: user.name
    });

    if (!result.ok) {
      onAddNotif(`Your toxic post(${postText}) blocked due to ${result.label} content`);
      setErrorMsg(`Blocked. Try reposting healthy content`);
      setPostText('');
      return;
    }

    setPosts([result.post, ...posts]);
    setPostText('');
    setErrorMsg('');
  } catch (err: any) {
    setErrorMsg(err.message || 'Failed to create post.');
  }

};
 
  // ✅ SAVE POST EDIT (backend moderation happens in backend PUT as well)
  const handleSaveEditPost = async () => {
    if (!editPostText.trim()) return;
    if (!isEditingPost) return;

    try {
      await ApiService.updatePost(isEditingPost, editPostText);
      setPosts(posts.map(p => p.post_id === isEditingPost ? { ...p, post_desc: editPostText } : p));
      setIsEditingPost(null);
      setEditPostText('');
      setErrorMsg('');
    } catch (err: any) {
      if (err instanceof ModerationError || err?.name === "ModerationError") {
        onAddNotif(`Edit blocked: Toxic content detected (${err.label})`);
        setIsEditingPost(null);
        return;
      }
      setErrorMsg(err.message || 'Failed to update post.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#e0fcfc]">
      <Header onNavigate={onNavigate} hasNewNotif={hasNewNotif} onReadNotif={onReadNotif} activePage={Page.DASHBOARD} />

      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-grow">
        <div className="bg-white rounded-3xl p-6 mb-8 flex items-center gap-6 shadow-sm border border-cyan-100">
          <div className="w-20 h-20 bg-cyan-200 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
            <img src={user.profile_pic || 'components/images/profile.png'} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#1a1a1a]">{user.name}</h2>
            <p className="text-gray-500 font-medium">@{user.user_email.split('@')[0]}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 mb-8 shadow-sm border border-cyan-100">
          <textarea
            className="w-full p-4 bg-white border border-gray-200 rounded-2xl resize-none text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5ce1e6]"
            rows={4}
            placeholder="What do you want to tell everyone?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          ></textarea>
          {errorMsg && <p className="text-red-500 text-sm mt-2 font-bold">{errorMsg}</p>}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCreatePost}
              className="px-10 py-2 btn-custom font-bold rounded-full shadow-md"
            >
              Post
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {posts.map(post => (
            <PostItem
              key={post.post_id}
              post={post}
              currentUserId={user.user_id}
              currentUser={user}
              onDelete={() => setIsDeletingPost(post.post_id)}
              onEdit={() => { setIsEditingPost(post.post_id); setEditPostText(post.post_desc); }}
              onAddNotif={onAddNotif}
              onError={setErrorMsg}
            />
          ))}
        </div>
      </main>

      <Footer />

      <ConfirmModal
        isOpen={!!isDeletingPost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action is permanent."
        onConfirm={async () => {
          if (!isDeletingPost) return;
          try {
            await ApiService.deletePost(isDeletingPost);
            setPosts(posts.filter(p => p.post_id !== isDeletingPost));
          } catch (err: any) {
            setErrorMsg(err.message || 'Failed to delete post.');
          } finally {
            setIsDeletingPost(null);
          }
        }}
        onCancel={() => setIsDeletingPost(null)}
      />

      {isEditingPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-[#1a1a1a]">Edit Post</h3>
            <textarea
              className="w-full p-4 border border-gray-200 rounded-2xl mb-4 text-black bg-white focus:outline-none focus:ring-2 focus:ring-[#5ce1e6]"
              rows={4}
              value={editPostText}
              onChange={e => setEditPostText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsEditingPost(null)} className="px-4 py-2 font-bold text-gray-500">Cancel</button>
              <button onClick={handleSaveEditPost} className="px-6 py-2 btn-custom rounded-full font-bold">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PostItemProps {
  post: Post;
  currentUserId: string;
  currentUser: User;
  onDelete: () => void;
  onEdit: () => void;
  onAddNotif: (msg: string) => void;
  onError: (msg: string) => void;
}

const PostItem: React.FC<PostItemProps> = ({ post, currentUserId, currentUser, onDelete, onEdit, onAddNotif, onError }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [isDeletingComment, setIsDeletingComment] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');

  useEffect(() => {
    let isMounted = true;
    if (showComments) {
      setIsLoadingComments(true);
      ApiService.fetchComments(post.post_id)
        .then(data => {
          if (isMounted) setComments(data);
        })
        .catch(() => {
          if (isMounted) onError('Failed to load comments.');
        })
        .finally(() => {
          if (isMounted) setIsLoadingComments(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [showComments, post.post_id, onError]);

  // ✅ ADD COMMENT (backend moderation)
  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
            
      const result = await ApiService.addComment({
        post_id: post.post_id,
        c_user_id: currentUser.user_id,
        comment_text: newComment,
        author_name: currentUser.name
      });

      if (!result.ok) {
        onAddNotif(`Your toxic comment (${newComment}) blocked due to ${result.label} content`);               
        setNewComment('');
        return;
      }

      setComments([...comments, result.comment]);
      setNewComment('');      
    } catch (err: any) {
      onError(err.message || 'Failed to add comment.');
    }

  };

  // ✅ SAVE COMMENT EDIT (backend moderation in PUT)
  const handleSaveCommentEdit = async (id: string) => {
    if (!editCommentText.trim()) return;

    try {
      await ApiService.updateComment(id, editCommentText);
      setComments(comments.map(c => c.comment_id === id ? { ...c, comment_text: editCommentText } : c));
      setEditingCommentId(null);
    } catch (err: any) {
      if (err instanceof ModerationError || err?.name === "ModerationError") {
        onAddNotif(`Comment edit blocked: Toxic content detected (${err.label})`);
        setEditingCommentId(null);
        return;
      }
      onError(err.message || 'Failed to update comment.');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-cyan-100">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden">
            <img src="components/images/profile.png" alt="Ava" className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-[#1a1a1a]">{post.author_name}</h4>
            <p className="text-xs text-gray-400 font-medium">
              {new Date(post.p_content_created_time).toLocaleTimeString()}
            </p>
          </div>
        </div>
        {post.p_user_id === currentUserId && (
          <div className="flex gap-1">
            <button onClick={onEdit} className="p-2 nav-icon hover:bg-gray-50 rounded-full transition-all" title="Edit Post">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button onClick={onDelete} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" title="Delete Post">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
        )}
      </div>

      <p className="text-black leading-relaxed mb-6 font-medium whitespace-pre-wrap">{post.post_desc}</p>

      <div className="flex gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 text-gray-400 hover:text-[#5ce1e6] transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-sm font-bold">{comments.length}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-1">
          {isLoadingComments && (
            <p className="text-sm text-gray-400 font-bold">Loading comments...</p>
          )}
          {comments.map(comment => (
            <div key={comment.comment_id} className="bg-cyan-50 p-4 rounded-2xl relative group">
              <div className="flex justify-between items-start">
                <p className="font-bold text-sm text-[#1a1a1a]">{comment.author_name}</p>
                {comment.c_user_id === currentUserId && (
                  <div className="flex gap-1 opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingCommentId(comment.comment_id); setEditCommentText(comment.comment_text); }}
                      className="nav-icon p-1 hover:text-blue-500"
                      title="Edit Comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                      onClick={() => setIsDeletingComment(comment.comment_id)}
                      className="text-red-400 p-1 hover:text-red-600"
                      title="Delete Comment"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
              {editingCommentId === comment.comment_id ? (
                <div className="mt-2">
                  <input
                    className="w-full p-2 border border-gray-200 rounded-lg text-black bg-white focus:outline-none focus:ring-1 focus:ring-[#5ce1e6]"
                    value={editCommentText}
                    onChange={e => setEditCommentText(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSaveCommentEdit(comment.comment_id)}
                    autoFocus
                  />
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => handleSaveCommentEdit(comment.comment_id)} className="text-xs bg-cyan-500 text-white px-3 py-1 rounded-full font-bold shadow-sm">Save</button>
                    <button onClick={() => setEditingCommentId(null)} className="text-xs text-gray-500 font-bold">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-700 mt-1">{comment.comment_text}</p>
              )}
            </div>
          ))}
          <div className="flex gap-2">
            <input
              className="flex-grow p-2 px-4 rounded-full border border-gray-200 text-sm focus:ring-2 focus:ring-[#5ce1e6] bg-white text-black outline-none shadow-inner"
              placeholder="Write a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleAddComment()}
            />
            <button onClick={handleAddComment} className="px-6 py-1 btn-custom rounded-full text-sm font-bold">Add</button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!isDeletingComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action is permanent."
        onConfirm={async () => {
          if (!isDeletingComment) return;
          try {
            await ApiService.deleteComment(isDeletingComment);
            setComments(comments.filter(c => c.comment_id !== isDeletingComment));
          } catch (err: any) {
            onError(err.message || 'Failed to delete comment.');
          } finally {
            setIsDeletingComment(null);
          }
        }}
        onCancel={() => setIsDeletingComment(null)}
      />
    </div>
  );
};

export default Dashboard;
