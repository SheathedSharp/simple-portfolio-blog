import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

export class AuthManager {
    constructor() {
        this.modal = document.getElementById('authModal');
        this.closeBtn = document.querySelector('.close');
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.authButtons = document.querySelector('.auth-buttons');
        this.avatarUpload = document.getElementById('avatarUpload');
        this.userAvatar = document.getElementById('userAvatar');
        this.currentUser = null;
        this.userRole = null;

        this.initializeEventListeners();
        this.initializeAuthStateListener();
        this.initializeAuth();

        this.userAvatar?.addEventListener('click', () => {
            this.avatarUpload.click();
        });
        
        this.avatarUpload?.addEventListener('change', (e) => {
            if (e.target.files[0] && this.validateImage(e.target.files[0])) {
                this.handleAvatarUpload(e.target.files[0]);
            }
        });

        console.log('AuthManager initialized');
    }

    initializeEventListeners() {
        // 使用事件委托来处理登录和注册按钮的点击
        this.authButtons.addEventListener('click', (e) => {
            if (e.target.id === 'loginBtn') {
                console.log('Login button clicked');
                this.showLoginForm();
            } else if (e.target.id === 'registerBtn') {
                console.log('Register button clicked');
                this.showRegisterForm();
            } else if (e.target.id === 'logoutBtn') {
                auth.signOut();
            }
        });
        
        // 其他事件监听保持不变
        this.closeBtn?.addEventListener('click', () => this.hideModal());
        
        // 表单切换
        document.getElementById('switchToRegister')?.addEventListener('click', 
            () => this.switchForms('register'));
        document.getElementById('switchToLogin')?.addEventListener('click', 
            () => this.switchForms('login'));
        
        // 提交处理
        document.getElementById('submitLogin')?.addEventListener('click', 
            () => this.handleLogin());
        document.getElementById('submitRegister')?.addEventListener('click', 
            () => this.handleRegister());
        
        // 点击模态框外部关闭
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hideModal();
        });
    }

    showLoginForm() {
        console.log('Showing login form');
        this.modal.style.display = 'block';
        this.loginForm.classList.remove('hidden');
        this.registerForm.classList.add('hidden');
    }

    showRegisterForm() {
        this.modal.style.display = 'block';
        this.registerForm.classList.remove('hidden');
        this.loginForm.classList.add('hidden');
    }

    hideModal() {
        this.modal.style.display = 'none';
    }

    switchForms(type) {
        if (type === 'register') {
            this.loginForm.classList.add('hidden');
            this.registerForm.classList.remove('hidden');
        } else {
            this.registerForm.classList.add('hidden');
            this.loginForm.classList.remove('hidden');
        }
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('登录成功:', userCredential.user);
            this.hideModal();
            alert('登录功！');
        } catch (error) {
            console.error('登录错误:', error);
            alert('登录失败：' + this.getErrorMessage(error.code));
        }
    }

    async handleRegister() {
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致！');
            return;
        }

        if (password.length < 6) {
            alert('密码长度至少需要6个字符！');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 设置默认头像
            const defaultAvatarUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + email;
            
            // 创建用户文档
            const userRef = doc(db, 'users', userCredential.user.uid);
            await setDoc(userRef, {
                email: email,
                avatarUrl: defaultAvatarUrl,
                createdAt: new Date().toISOString() // 使用 ISO 字符串格式
            });

            console.log('注册成功:', userCredential.user);
            alert('注册成功！');
            this.switchForms('login');
        } catch (error) {
            console.error('注册错误:', error);
            alert('注册失败：' + this.getErrorMessage(error.code));
        }
    }

    async updateAuthUI(isLoggedIn, email = '') {
        if (isLoggedIn && auth.currentUser) {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userRef);
                
                let avatarUrl;
                let isAdmin = false;
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    avatarUrl = userData.avatarUrl;
                    isAdmin = userData.role === 'admin';
                } else {
                    avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
                    await setDoc(userRef, {
                        email: email,
                        avatarUrl: avatarUrl,
                        role: 'user',
                        createdAt: new Date().toISOString()
                    });
                }
                
                this.authButtons.innerHTML = `
                    <div class="user-avatar ${isAdmin ? 'admin-avatar' : ''}">
                        <img id="userAvatar" src="${avatarUrl}" alt="User Avatar">
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        ${isAdmin ? '<span class="admin-badge" title="管理员">👑</span>' : ''}
                    </div>
                    <span title="${email}">${email}</span>
                    <button id="logoutBtn" class="auth-btn">退出</button>
                `;
                
                this.avatarUpload = document.getElementById('avatarUpload');
                this.userAvatar = document.getElementById('userAvatar');
                this.initializeAvatarListeners();
            } catch (error) {
                console.error('获取用户信息失败:', error);
                this.authButtons.innerHTML = `
                    <div class="user-avatar">
                        <img id="userAvatar" src="https://api.dicebear.com/7.x/avataaars/svg?seed=${email}" alt="User Avatar">
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                    </div>
                    <span title="${email}">${email}</span>
                    <button id="logoutBtn" class="auth-btn">退出</button>
                `;
                
                this.avatarUpload = document.getElementById('avatarUpload');
                this.userAvatar = document.getElementById('userAvatar');
                this.initializeAvatarListeners();
            }
        } else {
            this.authButtons.innerHTML = `
                <button id="loginBtn" class="auth-btn">登录</button>
                <button id="registerBtn" class="auth-btn">注册</button>
            `;
        }
    }

    initializeAuthStateListener() {
        auth.onAuthStateChanged((user) => {
            this.updateAuthUI(!!user, user?.email);
        });
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': '该邮箱已被注册',
            'auth/invalid-email': '无效的邮箱地址',
            'auth/operation-not-allowed': '邮箱/密码登录未启用',
            'auth/weak-password': '密码强度太弱',
            'auth/user-disabled': '该用户账号已被禁用',
            'auth/user-not-found': '用户不存在',
            'auth/wrong-password': '密码错误',
            'auth/invalid-credential': '无效的登录证'
        };
        return errorMessages[errorCode] || '发生未知错误';
    }

    async handleAvatarUpload(file) {
        if (!file || !auth.currentUser) return;
        
        try {
            // 显示上传中状态
            this.userAvatar.style.opacity = '0.5';
            
            const imgbbApiKey = '861402a33957ad16903bb5d0c99f2e58';
            const formData = new FormData();
            formData.append('image', file);

            console.log('Uploading file:', file.name, file.type, file.size);

            const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Upload failed:', response.status, errorText);
                throw new Error(`Upload failed: ${response.status}`);
            }

            const data = await response.json();
            console.log('Upload response:', data);

            if (data.success) {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                await updateDoc(userRef, {
                    avatarUrl: data.data.url
                });
                
                // 更新界面
                this.userAvatar.src = data.data.url;
                this.userAvatar.style.opacity = '1';
                alert('头像更新成功！');
            } else {
                throw new Error('Upload failed: ' + (data.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('头像上传失败:', error);
            alert('头像上传失败，请重试');
            this.userAvatar.style.opacity = '1';
        }
    }

    // 添加图片大小限制
    validateImage(file) {
        // 检查文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('只支持 JPG、PNG 和 GIF 格式的图片');
            return false;
        }

        // 限制文件大小为 500KB
        const maxSize = 500 * 1024; // 500KB
        if (file.size > maxSize) {
            alert('图片大小不能超过 500KB');
            return false;
        }

        return true;
    }

    initializeAvatarListeners() {
        this.userAvatar?.addEventListener('click', () => {
            this.avatarUpload.click();
        });
        
        this.avatarUpload?.addEventListener('change', (e) => {
            if (e.target.files[0] && this.validateImage(e.target.files[0])) {
                this.handleAvatarUpload(e.target.files[0]);
            }
        });
    }

    async initializeAuth() {
        auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                // 获取用户角色
                await this.loadUserRole();
                // 触发用户登录事件
                this.dispatchUserStateChange();
            } else {
                this.userRole = null;
                this.dispatchUserStateChange();
            }
        });
    }

    async loadUserRole() {
        try {
            const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
            if (userDoc.exists()) {
                this.userRole = userDoc.data().role || 'user';
            } else {
                // 如果用户文档不存在，创建一个新的用户文档
                await setDoc(doc(db, 'users', this.currentUser.uid), {
                    email: this.currentUser.email,
                    role: 'user',
                    createdAt: new Date()
                });
                this.userRole = 'user';
            }
        } catch (error) {
            console.error('Error loading user role:', error);
            this.userRole = 'user';
        }
    }

    dispatchUserStateChange() {
        // 触发自定义事件，通知其他组件用户状态改变
        const event = new CustomEvent('userStateChanged', {
            detail: {
                user: this.currentUser,
                role: this.userRole
            }
        });
        document.dispatchEvent(event);
    }

    isAdmin() {
        return this.userRole === 'admin';
    }

    // 添加一个方法来检查用户是否已登录
    isLoggedIn() {
        return !!this.currentUser;
    }
}