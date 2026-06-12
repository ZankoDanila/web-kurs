document.addEventListener("DOMContentLoaded", () => {
    // Получаем DOM элементы
    const authCard = document.getElementById("auth-card");
    const loginView = document.getElementById("login-view");
    const registerView = document.getElementById("register-view");
    
    const btnGoToRegister = document.getElementById("go-to-register");
    const btnGoToLogin = document.getElementById("go-to-login");

    // Функция переключения на Регистрацию
    btnGoToRegister.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Скрываем логин, показываем регистрацию
        loginView.classList.remove("active-view");
        registerView.classList.add("active-view");
        
        // Расширяем карточку для сетки из 8 полей
        authCard.classList.add("expanded");
        
        // Скрываем возможные старые ошибки
        document.getElementById("login-error").style.display = "none";
        document.getElementById("register-error").style.display = "none";
    });

    // Функция переключения на Вход
    btnGoToLogin.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Скрываем регистрацию, показываем логин
        registerView.classList.remove("active-view");
        loginView.classList.add("active-view");
        
        // Возвращаем компактную ширину карточки
        authCard.classList.remove("expanded");

        // Скрываем возможные старые ошибки
        document.getElementById("login-error").style.display = "none";
        document.getElementById("register-error").style.display = "none";
    });

    // Демонстрация вызова ошибки (для тестирования валидации)
    // В будущем эта логика будет заменена на реальный fetch-запрос к API
    const loginForm = document.getElementById("login-form");
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // Пример: показываем ошибку
        // document.getElementById("login-error").style.display = "block";
        
        // Пример успешного входа:
        // window.location.href = "Cabinet.html";
    });

    const registerForm = document.getElementById("register-form");
    registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // Пример: показываем ошибку
        // document.getElementById("register-error").style.display = "block";
    });
});
