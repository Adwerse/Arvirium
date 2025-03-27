// Функции для работы с авторизацией
class Auth {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.baseUrl = '/api'; // Базовый URL для API
        
        // Инициализация при создании экземпляра
        this.checkAuth();
    }

    // Регистрация нового пользователя
    async register(userData) {
        try {
            const response = await fetch(`${this.baseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Registration failed with status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Вход в систему
    async login(credentials) {
        try {
            const response = await fetch(`${this.baseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `Login failed with status: ${response.status}`);
            }

            const data = await response.json();
            this.isAuthenticated = true;
            this.currentUser = data.user;
            
            // Инициализируем данные пользователя при входе, если их нет
            this.initUserData(data.user);
            
            // Сохраняем в localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            
            // Сохраняем постоянную копию данных пользователя для восстановления
            localStorage.setItem('user_backup', JSON.stringify(this.currentUser));
            
            return { ...data, user: this.currentUser };
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    // Инициализация данных пользователя
    initUserData(user) {
        if (!user) return;
        
        // Проверяем, есть ли в localStorage сохраненные данные для этого пользователя
        const userBackup = localStorage.getItem('user_backup');
        if (userBackup) {
            const parsedBackup = JSON.parse(userBackup);
            // Если это тот же пользователь, восстанавливаем его данные
            if (parsedBackup && parsedBackup.email === user.email) {
                // Восстанавливаем финансовые данные из резервной копии
                user.coins = parsedBackup.coins || 0;
                user.balance = parsedBackup.balance || 0;
                user.btcBalance = parsedBackup.btcBalance || 0;
                user.ethBalance = parsedBackup.ethBalance || 0;
                user.transactions = parsedBackup.transactions || [];
                console.log('Восстановлены данные пользователя из резервной копии');
                return;
            }
        }
        
        // Если резервная копия не найдена или это другой пользователь, инициализируем значения по умолчанию
        if (!user.coins) user.coins = 0;
        if (!user.balance) user.balance = 0;
        if (!user.btcBalance) user.btcBalance = 0;
        if (!user.ethBalance) user.ethBalance = 0;
        if (!user.transactions) user.transactions = [];
    }

    // Выход из системы
    logout() {
        // Перед выходом сохраняем данные пользователя
        if (this.currentUser) {
            // Обновляем данные пользователя из localStorage перед выходом
            const userData = localStorage.getItem('user');
            if (userData) {
                // Сохраняем резервную копию
                localStorage.setItem('user_backup', userData);
            }
        }
        
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }

    // Проверка авторизации
    checkAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            this.isAuthenticated = true;
            this.currentUser = JSON.parse(user);
            
            // Инициализируем данные пользователя, если они не полные
            this.initUserData(this.currentUser);
            
            // Обновляем данные в localStorage
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            return true;
        }
        
        return false;
    }

    // Получение данных пользователя
    async getUserData() {
        if (!this.isAuthenticated) {
            throw new Error('User not authenticated');
        }

        try {
            const response = await fetch(`${this.baseUrl}/user`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();
            
            // Сохраняем важные финансовые данные
            if (this.currentUser) {
                data.coins = this.currentUser.coins || 0;
                data.balance = this.currentUser.balance || 0;
                data.btcBalance = this.currentUser.btcBalance || 0;
                data.ethBalance = this.currentUser.ethBalance || 0;
                data.transactions = this.currentUser.transactions || [];
            }
            
            this.currentUser = data;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            return data;
        } catch (error) {
            console.error('Error fetching user data:', error);
            throw error;
        }
    }
    
    // Обновление данных пользователя
    updateUserData(changes) {
        if (!this.isAuthenticated || !this.currentUser) {
            console.error('Cannot update data: user not authenticated');
            return false;
        }
        
        // Обновляем только существующие поля
        Object.assign(this.currentUser, changes);
        
        // Сохраняем обновленные данные
        localStorage.setItem('user', JSON.stringify(this.currentUser));
        localStorage.setItem('user_backup', JSON.stringify(this.currentUser));
        
        return true;
    }
}

// Создаем экземпляр Auth
const auth = new Auth();

// Экспортируем для использования в других файлах
export default auth; 