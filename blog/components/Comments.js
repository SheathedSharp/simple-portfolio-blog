import { auth, db } from '../../scripts/firebase-config.js';
import { 
    collection, addDoc, getDocs, query, 
    where, orderBy, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export class Comments {
    constructor(postId, container) {
        this.postId = postId;
        this.container = container;
        this.currentUser = null;

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
    }

    async loadComments() {
        try {
            const commentsQuery = query(
                collection(db, 'comments'),
                where('postId', '==', this.postId),
                orderBy('createdAt', 'desc')
            );

            const querySnapshot = await getDocs(commentsQuery);
            const commentsHTML = querySnapshot.docs.map(doc => {
                const comment = doc.data();
                return this.renderCommentItem(comment);
            }).join('');

            const commentsSection = this.container.querySelector('.comments-list');
            if (commentsSection) {
                commentsSection.innerHTML = commentsHTML;
            }
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    }

    renderCommentForm() {
        const formHTML = this.currentUser ? `
            <form class="comment-form">
                <textarea 
                    placeholder="写下你的评论..." 
                    required
                ></textarea>
                <button type="submit">发表评论</button>
            </form>
        ` : `
            <p class="login-prompt">
                请<a href="#" onclick="document.getElementById('authModal').style.display='block'">登录</a>后发表评论
            </p>
        `;

        const formSection = this.container.querySelector('.comment-form-section');
        if (formSection) {
            formSection.innerHTML = formHTML;
        }
    }

    renderCommentItem(comment) {
        return `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">
                        ${new Date(comment.createdAt?.toDate()).toLocaleString()}
                    </span>
                </div>
                <div class="comment-content">${comment.content}</div>
            </div>
        `;
    }

    async submitComment() {
        if (!this.currentUser) return;

        const textarea = this.container.querySelector('.comment-form textarea');
        const content = textarea.value.trim();

        if (!content) return;

        try {
            await addDoc(collection(db, 'comments'), {
                postId: this.postId,
                content: content,
                author: this.currentUser.displayName || '匿名用户',
                authorId: this.currentUser.uid,
                createdAt: serverTimestamp()
            });

            textarea.value = '';
            await this.loadComments();
        } catch (error) {
            console.error('Error submitting comment:', error);
            alert('评论发布失败，请重试');
        }
    }
}