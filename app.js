document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:3000/api'; 
  
  // --- ЭЛЕМЕНТЫ ФОРМЫ РЕГИСТРАЦИИ ---
  const formRegister = document.getElementById('form-register');
  const btnRegister = document.getElementById('btn-register');
  
  const inPhone = document.getElementById('reg-phone');
  const inEmail = document.getElementById('reg-email');
  const inDob = document.getElementById('reg-dob');
  const inFio = document.getElementById('reg-fio');
  const inNickname = document.getElementById('reg-nickname');
  const btnRegenNick = document.getElementById('btn-regen-nick');
  
  const inAutoPass = document.getElementById('reg-auto-pass');
  const inPassword = document.getElementById('reg-password');
  const inConfirm = document.getElementById('reg-confirm');
  const inAgreement = document.getElementById('reg-agreement');

  // Утилита для показа ошибок под полями
  const showError = (inputId, errId, message) => {
    const errSpan = document.getElementById(errId);
    if (message) {
      errSpan.textContent = message;
      errSpan.style.color = '#B91C1C';
      errSpan.style.fontSize = '12px';
      errSpan.style.marginTop = '4px';
    } else {
      errSpan.textContent = '';
    }
  };

  // --- 1. ГЕНЕРАЦИЯ НИКНЕЙМА  ---
  let nickAttempts = 0;
  const generateNickname = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    inNickname.value = `User_${randomNum}`;
  };
  
  // Инициализируем никнейм при загрузке
  generateNickname();

  btnRegenNick.addEventListener('click', () => {
    if (nickAttempts < 5) {
      generateNickname();
      nickAttempts++;
    } else {
      // После 5 попыток даем вводить вручную 
      inNickname.readOnly = false;
      btnRegenNick.disabled = true;
      btnRegenNick.style.opacity = '0.5';
      showError('reg-nickname', 'err-nickname', 'Лимит генерации исчерпан. Введите никнейм вручную.');
    }
    validateForm();
  });

  // --- 2. ЗАПРЕТ ВСТАВКИ ПАРОЛЯ [cite: 647] ---
  inConfirm.addEventListener('paste', (e) => {
    e.preventDefault();
    showError('reg-confirm', 'err-confirm', 'Вставка пароля запрещена правилами безопасности');
  });

  // --- 3. АВТОГЕНЕРАЦИЯ ПАРОЛЯ [cite: 646] ---
  inAutoPass.addEventListener('change', (e) => {
    const groupConfirm = document.getElementById('group-confirm');
    if (e.target.checked) {
      // Сложный пароль по ТЗ: Заглавная, строчная, цифра, спецсимвол, длина > 8
      const autoPw = `A${Math.floor(Math.random() * 10000)}b!X${Math.floor(Math.random() * 10)}`;
      inPassword.value = autoPw;
      inPassword.type = 'text'; // Показываем пароль пользователю
      inConfirm.value = autoPw; 
      groupConfirm.style.display = 'none'; // Прячем поле повтора
    } else {
      inPassword.value = '';
      inPassword.type = 'password';
      inConfirm.value = '';
      groupConfirm.style.display = 'flex';
    }
    validateForm();
  });

  // --- 4. ОСНОВНАЯ ВАЛИДАЦИЯ ФОРМЫ ---
  // Запускается при каждом изменении (input/change) в любом поле [cite: 654, 655]
  const validateForm = () => {
    let isValid = true;

    // Валидация телефона (Только РБ) 
    // Формат РБ: +375 (29|33|44|25|17) ХХХ-ХХ-ХХ
    const phoneRegex = /^\+375(29|33|44|25|17)\d{7}$/;
    const phoneClean = inPhone.value.replace(/\D/g, ''); // очищаем от скобок и тире
    if (!/^\+375/.test(inPhone.value) || phoneClean.length !== 12) {
      showError('reg-phone', 'err-phone', 'Введите корректный номер РБ (напр. +375291112233)');
      isValid = false;
    } else {
      showError('reg-phone', 'err-phone', '');
    }

    // Валидация Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inEmail.value)) {
      showError('reg-email', 'err-email', 'Неверный формат Email');
      isValid = false;
    } else {
      showError('reg-email', 'err-email', '');
    }

    // Валидация Возраста (16+) 
    if (!inDob.value) {
      showError('reg-dob', 'err-dob', 'Укажите дату рождения');
      isValid = false;
    } else {
      const birthDate = new Date(inDob.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
      
      if (age < 16) {
        showError('reg-dob', 'err-dob', 'Регистрация доступна только лицам старше 16 лет');
        isValid = false;
      } else {
        showError('reg-dob', 'err-dob', '');
      }
    }

    // Валидация ФИО (Обязательно Имя и Фамилия) [cite: 651]
    const fioParts = inFio.value.trim().split(' ');
    if (fioParts.length < 2) {
      showError('reg-fio', 'err-fio', 'Введите как минимум Фамилию и Имя');
      isValid = false;
    } else {
      showError('reg-fio', 'err-fio', '');
    }

    // Валидация Никнейма (Если вводит вручную)
    if (!inNickname.value.trim()) {
      showError('reg-nickname', 'err-nickname', 'Никнейм не может быть пустым');
      isValid = false;
    } else if (nickAttempts >= 5) {
      showError('reg-nickname', 'err-nickname', ''); 
    }

    // Валидация Пароля (Строгие правила) [cite: 648, 649]
    // Строчная, заглавная, цифра, спецсимвол, длина 8-20
    const pwd = inPassword.value;
    const pwdRegex = /^(?=.*[a-zа-я])(?=.*[A-ZА-Я])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?\\|`~]).{8,20}$/;
    
    // Имитация списка ТОП-100 паролей [cite: 650]
    const topPasswords = ['12345678', 'password', '123456789', 'qwerty', '1234567'];
    
    if (!pwdRegex.test(pwd)) {
      showError('reg-password', 'err-password', 'Пароль (8-20 симв.) должен содержать заглавную и строчную букву, цифру и спецсимвол.');
      isValid = false;
    } else if (topPasswords.includes(pwd.toLowerCase())) {
      showError('reg-password', 'err-password', 'Этот пароль слишком простой (входит в ТОП-100 уязвимых).');
      isValid = false;
    } else {
      showError('reg-password', 'err-password', '');
    }

    // Валидация повтора пароля [cite: 647]
    if (!inAutoPass.checked && pwd !== inConfirm.value) {
      showError('reg-confirm', 'err-confirm', 'Пароли не совпадают');
      isValid = false;
    } else if (!inAutoPass.checked) {
      showError('reg-confirm', 'err-confirm', '');
    }

    // Соглашение
    if (!inAgreement.checked) {
      isValid = false;
    }

    // Управление кнопкой 
    if (isValid) {
      btnRegister.disabled = false;
      btnRegister.style.opacity = '1';
      btnRegister.style.cursor = 'pointer';
    } else {
      btnRegister.disabled = true;
      btnRegister.style.opacity = '0.5';
      btnRegister.style.cursor = 'not-allowed';
    }
  };

  // Навешиваем слушатели событий на все инпуты для моментального реагирования [cite: 654, 655]
  [inPhone, inEmail, inDob, inFio, inNickname, inPassword, inConfirm, inAgreement].forEach(input => {
    input.addEventListener('input', validateForm);
    input.addEventListener('change', validateForm);
  });

  // --- 5. ОТПРАВКА ДАННЫХ ---
  formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Двойная проверка на случай обхода HTML (кнопка разблокируется только при isValid = true)
    if (btnRegister.disabled) return; 

    // Разделение ФИО
    const fioParts = inFio.value.trim().split(' ');
    const lastName = fioParts[0];
    const firstName = fioParts[1];
    const middleName = fioParts.length > 2 ? fioParts.slice(2).join(' ') : '';

    const payload = {
      phone: inPhone.value,
      email: inEmail.value,
      dob: inDob.value,
      lastName: lastName,
      firstName: firstName,
      middleName: middleName,
      nickname: inNickname.value,
      password: inPassword.value
    };

    try {
      // Имитация Fetch запроса к нашему Node.js бекэнду
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка регистрации');
      }

      alert('Регистрация прошла успешно! Теперь вы можете войти в систему.');
      formRegister.reset();
      generateNickname();
      nickAttempts = 0;
      inNickname.readOnly = true;
      validateForm(); // Вернет кнопку в заблокированное состояние

    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    }
  });

  // Логика переключения табов (Вход/Регистрация) и форма входа остается из предыдущего решения...
});
