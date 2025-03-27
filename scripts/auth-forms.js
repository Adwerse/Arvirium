import auth from './auth.js';

// Функция для создания формы входа
function createLoginForm() {
    const form = document.createElement('form');
    form.id = 'login-form';
    form.className = 'auth-form';
    form.innerHTML = `
        <h2>Вход в систему</h2>
        <button type="button" class="close-btn" id="close-auth-btn">&times;</button>
        <div class="form-group">
            <label for="login-email">Email:</label>
            <input type="email" id="login-email" required>
        </div>
        <div class="form-group">
            <label for="login-password">Пароль:</label>
            <input type="password" id="login-password" required>
        </div>
        <button type="submit" class="btn btn-premium">Войти</button>
        <p class="form-switch">Нет аккаунта? <a href="#" id="show-register">Зарегистрироваться</a></p>
    `;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            await auth.login({ email, password });
            window.location.reload(); // Перезагрузка страницы после успешного входа
        } catch (error) {
            alert('Ошибка входа: ' + error.message);
        }
    });

    return form;
}

// Функция для создания формы регистрации
function createRegisterForm() {
    const form = document.createElement('form');
    form.id = 'register-form';
    form.className = 'auth-form';
    form.innerHTML = `
        <h2>Регистрация</h2>
        <button type="button" class="close-btn" id="close-auth-btn">&times;</button>
        <div class="form-group">
            <label for="register-username">Имя пользователя:</label>
            <input type="text" id="register-username" required>
        </div>
        <div class="form-group">
            <label for="register-email">Email:</label>
            <input type="email" id="register-email" required>
        </div>
        <div class="form-group">
            <label for="register-password">Пароль:</label>
            <input type="password" id="register-password" required>
        </div>
        <div class="form-group">
            <label for="register-password-confirm">Подтвердите пароль:</label>
            <input type="password" id="register-password-confirm" required>
        </div>
        <button type="submit" class="btn btn-premium">Зарегистрироваться</button>
        <p class="form-switch">Уже есть аккаунт? <a href="#" id="show-login">Войти</a></p>
    `;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;

            if (password !== passwordConfirm) {
                throw new Error('Пароли не совпадают');
            }

            await auth.register({ username, email, password });
            alert('Регистрация успешна! Теперь вы можете войти.');
            hideAuthContainer(); // Скрываем контейнер после успешной регистрации
            showLoginForm(); // Показываем форму входа
        } catch (error) {
            alert('Ошибка регистрации: ' + error.message);
        }
    });

    return form;
}

// Функция для отображения формы входа
function showLoginForm() {
    const container = document.getElementById('auth-container');
    container.innerHTML = '';
    container.appendChild(createLoginForm());
}

// Функция для отображения формы регистрации
function showRegisterForm() {
    const container = document.getElementById('auth-container');
    container.innerHTML = '';
    container.appendChild(createRegisterForm());
}

// Функция для скрытия контейнера авторизации
function hideAuthContainer() {
    const container = document.getElementById('auth-container');
    if (container) {
        document.body.removeChild(container);
    }
}

// Инициализация форм авторизации
function initAuthForms() {
    const container = document.createElement('div');
    container.id = 'auth-container';
    document.body.appendChild(container);

    // Проверяем авторизацию при загрузке
    if (!auth.checkAuth()) {
        showLoginForm();
    }

    // Обработчики переключения между формами
    document.addEventListener('click', (e) => {
        if (e.target.id === 'show-register') {
            e.preventDefault();
            showRegisterForm();
        } else if (e.target.id === 'show-login') {
            e.preventDefault();
            showLoginForm();
        } else if (e.target.id === 'close-auth-btn') {
            e.preventDefault();
            hideAuthContainer();
        }
    });
}

// Экспортируем функцию инициализации
export default initAuthForms; 