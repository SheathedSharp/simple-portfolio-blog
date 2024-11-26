import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile,
    fetchSignInMethodsForEmail
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import { 
    doc, 
    getDoc, 
    setDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { Toast } from '../utils/Toast.js';

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
        this.isSubmitting = false;

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
        // 移除可能存在的旧事件监听器
        const oldAuthButtons = document.querySelector('.auth-buttons');
        const newAuthButtons = oldAuthButtons.cloneNode(true);
        oldAuthButtons.parentNode.replaceChild(newAuthButtons, oldAuthButtons);
        this.authButtons = newAuthButtons;

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
        
        // 移除旧的关闭按钮事件监听器
        const oldCloseBtn = this.closeBtn;
        const newCloseBtn = oldCloseBtn.cloneNode(true);
        oldCloseBtn.parentNode.replaceChild(newCloseBtn, oldCloseBtn);
        this.closeBtn = newCloseBtn;
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
        } catch (error) {
            console.error('登录错误:', error);
            Toast.error(this.getErrorMessage(error.code));
        }
    }

    async handleRegister() {
        if (this.isSubmitting) return;
        
        const submitButton = document.getElementById('submitRegister');
        const switchToLoginBtn = document.getElementById('switchToLogin');
        
        const nickname = document.getElementById('registerNickname')?.value.trim();
        const email = document.getElementById('registerEmail')?.value?.trim();
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;

        // 重置所有输入框的状态
        submitButton.querySelectorAll('input').forEach(input => {
            input.classList.remove('error');
        });

        // 验证昵称
        if (!nickname) {
            this.showError('请输入昵称！', 'registerNickname');
            return;
        }

        if (nickname.length < 2 || nickname.length > 20) {
            this.showError('昵称长度应在2-20个字符之间！', 'registerNickname');
            return;
        }

        // 验证邮箱
        if (!email) {
            this.showError('请输入邮箱！', 'registerEmail');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('请输入有效的邮箱地址！', 'registerEmail');
            return;
        }

        // 验证密码
        if (!password || !confirmPassword) {
            this.showError('请输入密码！');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('两次输入的密码不一致！', 'confirmPassword');
            return;
        }

        if (password.length < 6) {
            this.showError('密码长度至少需要6个字符！', 'registerPassword');
            return;
        }

        try {
            this.isSubmitting = true;
            submitButton.disabled = true;
            switchToLoginBtn.style.pointerEvents = 'none';
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';

            // 首先创建用户账号
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // 设置默认头像
            const defaultAvatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;
            
            // 更新用户显示名称和头像
            await updateProfile(userCredential.user, {
                displayName: nickname,
                photoURL: defaultAvatarUrl
            });

            // 创建用户文档
            try {
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    email: email,
                    nickname: nickname,
                    avatarUrl: defaultAvatarUrl,
                    role: 'user',
                    createdAt: serverTimestamp()
                });

                // 清空输入框
                document.getElementById('registerNickname').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('confirmPassword').value = '';
                
                // 显示成功消息
                Toast.success('注册成功！');
                
                // 隐藏模态框
                this.hideModal();

                // 自动登录（因为 Firebase 在注册后会自动登录）
                // 触发用户状态更新
                this.updateAuthUI(true, email);

            } catch (error) {
                console.error('创建用户文档失败:', error);
                // 如果创建用户文档失败，删除已创建的用户账号
                await userCredential.user.delete();
                throw error;
            }
        } catch (error) {
            console.error('注册错误:', error);
            Toast.error(this.getErrorMessage(error.code));
        } finally {
            this.isSubmitting = false;
            submitButton.disabled = false;
            switchToLoginBtn.style.pointerEvents = 'auto';
            submitButton.innerHTML = '注册';
        }
    }

    showError(message, inputId = null) {
        if (inputId) {
            const input = document.getElementById(inputId);
            if (input) {
                input.classList.add('error');
                input.focus();
            }
        }
        
        // 确保消息不为空
        if (!message || typeof message !== 'string') {
            message = '发生未知错误，请重试';
        }
        
        console.log('Showing error:', message); // 添加日志
        Toast.error(message);
    }

    showSuccess(message) {
        Toast.success(message);
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/email-already-in-use': '该邮箱已被注册',
            'auth/invalid-email': '无效的邮箱地址',
            'auth/operation-not-allowed': '邮箱注册未启用',
            'auth/weak-password': '密码强度太弱',
            'auth/network-request-failed': '网络连接失败',
            'auth/too-many-requests': '操作过于频繁，请稍后再试',
            'auth/user-not-found': '用户不存在',
            'auth/wrong-password': '密码错误',
            'auth/invalid-credential': '邮箱或密码错误',
            'default': '操作失败，请重试'
        };
        
        return errorMessages[errorCode] || errorMessages.default;
    }

    async updateAuthUI(isLoggedIn, email = '') {
        if (isLoggedIn && auth.currentUser) {
            try {
                const userRef = doc(db, 'users', auth.currentUser.uid);
                const userDoc = await getDoc(userRef);
                
                let avatarUrl;
                let nickname;
                let isAdmin = false;
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    avatarUrl = userData.avatarUrl;
                    nickname = userData.nickname;
                    isAdmin = userData.role === 'admin';
                } else {
                    avatarUrl = auth.currentUser.photoURL;
                    nickname = auth.currentUser.displayName || '用户';
                }
                
                this.authButtons.innerHTML = `
                    <div class="user-avatar ${isAdmin ? 'admin-avatar' : ''}">
                        <img id="userAvatar" src="${avatarUrl}" alt="${nickname}">
                        <input type="file" id="avatarUpload" accept="image/*" style="display: none;">
                        ${isAdmin ? '<span class="admin-badge" title="管理员"><i class="fas fa-crown"></i></span>' : ''}
                    </div>
                    <span class="user-nickname">${nickname}</span>
                    <button id="logoutBtn" class="auth-btn">退出</button>
                `;
                
                this.avatarUpload = document.getElementById('avatarUpload');
                this.userAvatar = document.getElementById('userAvatar');
                this.initializeAvatarListeners();
            } catch (error) {
                console.error('获取用户信息失败:', error);
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
                Toast.success('头像更新成功！');
            } else {
                throw new Error('Upload failed: ' + (data.error?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('头像上传失败:', error);
            Toast.error('头像上传失败，请重试');
            this.userAvatar.style.opacity = '1';
        }
    }

    // 添加图片大小限制
    validateImage(file) {
        // 检查文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            Toast.error('只支持 JPG、PNG 和 GIF 格式的图片');
            return false;
        }

        // 限制文件大小为 500KB
        const maxSize = 500 * 1024; // 500KB
        if (file.size > maxSize) {
            Toast.error('图片大小不能超过 500KB');
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

    initializeAuth() {
        let isFirstAuth = true; // 添加标志来追踪是否是首次认证
        
        auth.onAuthStateChanged(async (user) => {
            this.currentUser = user;
            if (user) {
                // 获取用户角色
                await this.loadUserRole();
                // 只在首次登录时显示提示
                if (isFirstAuth) {
                    Toast.success('登录成功！');
                }
                // 触发用户登录事件
                this.dispatchUserStateChange();
            } else {
                this.userRole = null;
                this.dispatchUserStateChange();
            }
            isFirstAuth = false; // 更新标志
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