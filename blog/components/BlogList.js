import { db } from '../../scripts/firebase-config.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export class BlogList {
    constructor(container) {
        this.container = container;
        this.posts = [];
        this.postsPerPage = 3; // 每页显示3篇
        this.currentPage = 1;
        this.initialize();
    }

    async initialize() {
        await this.loadPosts();
        this.render();
    }

    async loadPosts() {
        try {
            // 从 Firestore 加载博客列表
            const postsQuery = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(postsQuery);
            this.posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // 将 Timestamp 转换为日期字符串
                date: doc.data().createdAt?.toDate().toLocaleDateString('zh-CN')
            }));
        } catch (error) {
            console.error('Error loading posts:', error);
            this.posts = [];
        }
    }

    render() {
        if (this.posts.length === 0) {
            this.container.innerHTML = `
                <div class="blog-empty">
                    <h3>暂无博客文章</h3>
                    <p>敬请期待...</p>
                </div>
            `;
            return;
        }

        const totalPages = Math.ceil(this.posts.length / this.postsPerPage);
        const startIndex = (this.currentPage - 1) * this.postsPerPage;
        const displayPosts = this.posts.slice(startIndex, startIndex + this.postsPerPage);
        
        this.container.innerHTML = `
            <div class="blog-list-container">
                ${displayPosts.map(post => this.renderPostCard(post)).join('')}
            </div>
            ${this.renderPagination(totalPages)}
        `;

        // 添加分页按钮事件监听
        this.addPaginationListeners();
    }

    renderPagination(totalPages) {
        if (totalPages <= 1) return '';
        
        return `
            <div class="blog-pagination">
                <button class="page-btn" ${this.currentPage === 1 ? 'disabled' : ''} data-page="${this.currentPage - 1}">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <span class="page-info">${this.currentPage} / ${totalPages}</span>
                <button class="page-btn" ${this.currentPage === totalPages ? 'disabled' : ''} data-page="${this.currentPage + 1}">
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    addPaginationListeners() {
        const buttons = this.container.querySelectorAll('.page-btn');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                if (!button.disabled) {
                    this.currentPage = parseInt(button.dataset.page);
                    this.render();
                }
            });
        });
    }

    renderPostCard(post) {
        return `
            <div class="blog-card">
                <div class="blog-card-content">
                    <h3 class="blog-title">
                        <a href="blog/blog-detail.html?id=${post.id}">${post.title}</a>
                    </h3>
                    <div class="blog-meta">
                        <span class="blog-date">
                            <i class="far fa-calendar-alt"></i> ${post.date}
                        </span>
                        ${post.tags ? `
                            <div class="blog-tags">
                                ${post.tags.map(tag => `
                                    <span class="blog-tag" style="background-color: ${tag.color || '#666'}">${tag.name}</span>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}