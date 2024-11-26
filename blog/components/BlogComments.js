import { auth, db } from '../../js/firebase-config.js';
import { 
    collection, addDoc, getDocs, query, 
    where, orderBy, serverTimestamp, deleteDoc, doc, getDoc 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { Toast } from '../../utils/Toast.js';

export class Comments {
    constructor(postId, container) {
        this.postId = postId;
        this.container = container;
        this.currentUser = null;
        this.isSubmitting = false;
        this.isLoading = false;

        this.container.innerHTML = `
            <h3>评论</h3>
            <div class="comment-form-section"></div>
            <div class="comments-list"></div>
        `;

        this.formSection = this.container.querySelector('.comment-form-section');
        this.commentsList = this.container.querySelector('.comments-list');

        auth.onAuthStateChanged(user => {
            this.currentUser = user;
            this.renderCommentForm();
        });

        this.initialize();
    }

    async initialize() {
        await this.loadComments();
        this.bindEvents();
    }

    bindEvents() {
        this.container.querySelector('.comment-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComment();
        });

        this.container.addEventListener('deleteComment', (e) => {
            const commentElement = e.target.closest('.comment');
            if (commentElement) {
                const commentId = commentElement.dataset.commentId;
                this.deleteComment(commentId);
            }
        });
    }

    async loadComments() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        if (this.commentsList) {
            this.commentsList.innerHTML = '<div class="loading">加载评论中...</div>';
        }

        try {
            const commentsQuery = query(
                collection(db, 'comments'),
                where('postId', '==', this.postId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(commentsQuery);
            const comments = [];

            // 获取所有评论数据
            for (const docSnapshot of querySnapshot.docs) {
                const comment = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // 获取评论作者的最新信息
                try {
                    const userRef = doc(db, 'users', comment.authorId);
                    const userDoc = await getDoc(userRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        comment.avatarUrl = userData.avatarUrl;
                        comment.author = userData.nickname || comment.author;
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
                
                comments.push(comment);
            }

            const commentsHTML = comments.map(comment => this.renderCommentItem(comment)).join('');
            
            if (this.commentsList) {
                this.commentsList.innerHTML = commentsHTML || '<div class="no-comments">暂无评论</div>';
            }
        } catch (error) {
            console.error('Error loading comments:', error);
            if (this.commentsList) {
                this.commentsList.innerHTML = '<div class="error">加载评论失败</div>';
            }
        } finally {
            this.isLoading = false;
        }
    }

    async renderCommentForm() {
        if (!this.formSection) return;

        if (this.currentUser) {
            try {
                // 获取用户的最新信息
                const userRef = doc(db, 'users', this.currentUser.uid);
                const userDoc = await getDoc(userRef);
                const userData = userDoc.exists() ? userDoc.data() : null;
                
                const avatarUrl = userData?.avatarUrl || this.currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + this.currentUser.email;
                const nickname = userData?.nickname || this.currentUser.displayName || '匿名用户';

                const formHTML = `
                    <form class="comment-form">
                        <div class="comment-form-header">
                            <img 
                                src="${avatarUrl}" 
                                alt="${nickname}"
                                class="comment-avatar"
                            />
                            <div class="comment-user-info">
                                <span class="comment-user-name">${nickname}</span>
                            </div>
                        </div>
                        <textarea 
                            placeholder="写下你的评论..." 
                            required
                            maxlength="1000"
                        ></textarea>
                        <button type="submit" class="submit-btn">
                            <span class="btn-text">发表评论</span>
                            <span class="loading-spinner" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                        </button>
                    </form>
                `;

                this.formSection.innerHTML = formHTML;
            } catch (error) {
                console.error('Error fetching user data:', error);
                // 如果获取用户数据失败，使用默认值
                const formHTML = `
                    <form class="comment-form">
                        <div class="comment-form-header">
                            <img 
                                src="${this.currentUser.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + this.currentUser.email}" 
                                alt="${this.currentUser.displayName || '匿名用户'}"
                                class="comment-avatar"
                            />
                            <div class="comment-user-info">
                                <span class="comment-user-name">${this.currentUser.displayName || '匿名用户'}</span>
                            </div>
                        </div>
                        <textarea 
                            placeholder="写下你的评论..." 
                            required
                            maxlength="1000"
                        ></textarea>
                        <button type="submit" class="submit-btn">
                            <span class="btn-text">发表评论</span>
                            <span class="loading-spinner" style="display: none;">
                                <i class="fas fa-spinner fa-spin"></i>
                            </span>
                        </button>
                    </form>
                `;
                this.formSection.innerHTML = formHTML;
            }
        } else {
            this.formSection.innerHTML = `
                <p class="login-prompt">
                    请<a href="#" onclick="document.getElementById('authModal').style.display='block'">登录</a>后发表评论
                </p>
            `;
        }

        this.bindEvents();
    }

    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minute = 60 * 1000;
        const hour = 60 * minute;
        const day = 24 * hour;

        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return `${Math.floor(diff / minute)}分钟前`;
        } else if (diff < day) {
            return `${Math.floor(diff / hour)}小时前`;
        } else if (diff < 7 * day) {
            return `${Math.floor(diff / day)}天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    renderCommentItem(comment) {
        const isAuthor = this.currentUser && this.currentUser.uid === comment.authorId;
        const isAdmin = this.currentUser && this.currentUser.customClaims?.admin;
        const canDelete = isAuthor || isAdmin;

        return `
            <div class="comment" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-user">
                        <img 
                            src="${comment.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + comment.authorEmail}" 
                            alt="${comment.author}"
                            class="comment-avatar"
                        />
                        <div class="comment-user-info">
                            <span class="comment-author">${this.escapeHtml(comment.author)}</span>
                            <span class="comment-email">${this.escapeHtml(comment.authorEmail || '')}</span>
                            <span class="comment-date" title="${new Date(comment.createdAt?.toDate()).toLocaleString()}">
                                ${this.formatDate(comment.createdAt?.toDate())}
                            </span>
                        </div>
                    </div>
                    ${canDelete ? `
                        <button class="delete-comment" onclick="event.stopPropagation(); this.closest('.comment').dispatchEvent(new CustomEvent('deleteComment', {bubbles: true}))">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
                <div class="comment-content">${this.escapeHtml(comment.content)}</div>
            </div>
        `;
    }

    async deleteComment(commentId) {
        if (!confirm('确定要删除这条评论吗？')) return;

        try {
            await deleteDoc(doc(db, 'comments', commentId));
            await this.loadComments();
            Toast.success('评论删除成功');
        } catch (error) {
            console.error('Error deleting comment:', error);
            Toast.error('删除评论失败，请重试');
        }
    }

    async submitComment() {
        if (!this.currentUser || this.isSubmitting) return;

        const textarea = this.container.querySelector('.comment-form textarea');
        const submitBtn = this.container.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const loadingSpinner = submitBtn.querySelector('.loading-spinner');
        
        const content = textarea.value.trim();
        if (!content) return;

        this.isSubmitting = true;
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            // 获取用户的最新信息
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.exists() ? userDoc.data() : null;

            await addDoc(collection(db, 'comments'), {
                postId: this.postId,
                content: content,
                author: userData?.nickname || this.currentUser.displayName || '匿名用户',
                authorId: this.currentUser.uid,
                authorEmail: this.currentUser.email,
                avatarUrl: userData?.avatarUrl || this.currentUser.photoURL,
                createdAt: serverTimestamp()
            });

            textarea.value = '';
            await this.loadComments();
        } catch (error) {
            console.error('Error submitting comment:', error);
            Toast.error('评论发布失败，请重试');
        } finally {
            this.isSubmitting = false;
            btnText.style.display = 'inline-block';
            loadingSpinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    }
}