import { auth, db } from './firebase-config.js';
import { 
    collection, addDoc, getDocs, getDoc, deleteDoc, doc, 
    query, orderBy, updateDoc, serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { BlogList } from '../blog/components/BlogList.js';
import { BlogPublisher } from '../blog/components/BlogPublisher.js';
import { BlogDetail } from '../blog/components/BlogDetail.js';
import { AuthManager } from './AuthManager.js';


export class BlogManager {
    constructor() {
        this.authManager = new AuthManager();
        this.currentUser = null;
        this.blogList = null;
        this.blogDetail = null;
        this.mdFileInput = document.getElementById('mdFileInput');
        
        // 初始化 marked 配置
        marked.setOptions({
            breaks: true,
            gfm: true,
            headerIds: true,
            highlight: function(code, lang) {
                if (Prism && Prism.highlight) {
                    return Prism.highlight(code, Prism.languages[lang] || Prism.languages.plaintext, lang);
                }
                return code;
            }
        });

        this.blogPublisher = new BlogPublisher(document.getElementById('blogActions'));

        this.initialize();
    }

    async initialize() {
        // 监听用户状态变化
        document.addEventListener('userStateChanged', (event) => {
            const { user, role } = event.detail;
            this.updateUIBasedOnPermissions(role);
        });

        this.blogList = new BlogList(document.getElementById('blogList'));
        
        // 监听 hash 变化
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash;
            if (hash.startsWith('#blog/')) {
                const postId = hash.split('/')[1];
                this.showPost(postId);
            } else if (hash === '#blog') {
                this.showList();
            }
        });

        // 初始化显示
        if (window.location.hash.startsWith('#blog/')) {
            const postId = window.location.hash.split('/')[1];
            this.showPost(postId);
        } else {
            this.showList();
        }

        // 绑定事件
        this.bindEvents();
        // 加载博客列表
        this.loadBlogs();

        // 添加博客发布事件监听
        window.addEventListener('blogPublished', () => {
            this.loadBlogs();
            this.showSuccess('博客发布成功！');
        });
    }

    bindEvents() {
        document.getElementById('newBlogBtn')?.addEventListener('click', () => {
            if (!this.authManager.isAdmin()) {
                this.showError('只有管理员才能发布博客');
                return;
            }
            this.blogPublisher.triggerFileSelect();
        });
    }

    async loadBlogs() {
        try {
            const blogsQuery = query(
                collection(db, 'posts'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(blogsQuery);
            
            this.blogList.posts = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().createdAt?.toDate().toLocaleDateString()
            }));
            this.blogList.render();
        } catch (error) {
            console.error('Error loading blogs:', error);
            this.showError('加载博客列表失败');
        }
    }

    async deleteBlog(blogId) {
        if (!this.authManager.isAdmin()) {
            this.showError('只有管理员才能删除博客');
            return;
        }

        if (confirm('确定要删除这篇博客吗？')) {
            try {
                await deleteDoc(doc(db, 'posts', blogId));
                this.showList();
                this.showSuccess('博客已删除');
            } catch (error) {
                console.error('Error deleting blog:', error);
                this.showError('删除失败，请重试');
            }
        }
    }

    showError(message) {
        // 实现错误提示
        alert(message); // 可以改为更优雅的提示方式
    }

    showSuccess(message) {
        // 实现成功提示
        alert(message); // 可以改为更优雅的提示方式
    }

    showList() {
        this.blogList.container.style.display = 'block';
        this.blogList.render();
    }

    async showPost(postId) {
        this.blogList.container.style.display = 'none';
        await this.blogDetail.loadPost(postId);
    }

    updateUIBasedOnPermissions(role) {
        const adminControls = document.getElementById('blogActions');
        if (adminControls) {
            adminControls.style.display = role === 'admin' ? 'block' : 'none';
        }

        // 更新其他需要权限控制的UI元素
        const editButtons = document.querySelectorAll('.blog-edit-btn');
        const deleteButtons = document.querySelectorAll('.blog-delete-btn');
        
        editButtons.forEach(btn => {
            btn.style.display = role === 'admin' ? 'inline-block' : 'none';
        });
        
        deleteButtons.forEach(btn => {
            btn.style.display = role === 'admin' ? 'inline-block' : 'none';
        });
    }
} 