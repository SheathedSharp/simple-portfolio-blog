import { db } from '../../scripts/firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { Comments } from './Comments.js';

export class BlogDetail {
    constructor() {
        this.container = document.getElementById('blogContent');
        // 只在详情页面初始化
        if (this.container) {
            this.initialize();
        }
    }

    async initialize() {
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get('id');
        
        if (!postId) {
            this.renderError('未找到博客ID');
            return;
        }

        await this.loadPost(postId);
    }

    async loadPost(postId) {
        try {
            const docRef = doc(db, 'posts', postId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const post = {
                    id: docSnap.id,
                    ...docSnap.data(),
                    date: docSnap.data().createdAt?.toDate().toLocaleDateString('zh-CN')
                };
                this.render(post);
                
                // 初始化评论系统
                new Comments(postId, this.container.querySelector('.comments-container'));
            } else {
                this.renderError('博客不存在');
            }
        } catch (error) {
            console.error('Error loading post:', error);
            this.renderError('加载博客失败');
        }
    }

    render(post) {
        const html = marked.parse(post.content);
        
        this.container.innerHTML = `
            <article class="blog-post">
                <h1 class="blog-post-title">${post.title}</h1>
                <div class="blog-post-meta">
                    <span class="blog-date">
                        <i class="far fa-calendar-alt"></i> ${post.date}
                    </span>
                    <span class="blog-author">
                        <i class="far fa-user"></i> ${post.author}
                    </span>
                    ${post.tags ? `
                        <div class="blog-tags">
                            ${post.tags.map(tag => `
                                <span class="blog-tag" style="background-color: ${tag.color || '#666'}">${tag.name}</span>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="blog-post-content">
                    ${html}
                </div>
                <div class="blog-post-footer">
                    <a href="../index.html#blog" class="back-to-list">
                        <i class="fas fa-arrow-left"></i> 返回博客列表
                    </a>
                </div>
                <div class="comments-container">
                    <h3>评论</h3>
                    <div class="comments-section"></div>
                </div>
            </article>
        `;

        // 代码高亮
        Prism.highlightAll();
    }

    renderError(message = '加载失败') {
        this.container.innerHTML = `
            <div class="blog-error">
                <h2>${message}</h2>
                <p>抱歉，无法加载所请求的文章。</p>
                <a href="../index.html#blog" class="back-to-list">
                    <i class="fas fa-arrow-left"></i> 返回博客列表
                </a>
            </div>
        `;
    }
}

// 只在详情页面初始化
if (document.getElementById('blogContent')) {
    new BlogDetail();
}