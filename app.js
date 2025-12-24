/**
 * Клас для представлення події календаря
 * Містить усі властивості та методи, пов'язані з окремою подією
 */
class CalendarEvent {
    /**
     * Створює нову подію календаря
     * @param {Object} data - Об'єкт з даними події
     * @param {string} data.title - Назва події (обов'язково)
     * @param {string} data.date - Дата події у форматі ISO (YYYY-MM-DD)
     * @param {string} [data.time] - Час події (необов'язково)
     * @param {string} [data.description] - Опис події (необов'язково)
     * @param {string} [data.category] - Категорія події (work, personal, important)
     * @param {string} [data.color] - Колір події у форматі HEX
     */
    constructor(data) {
        this.id = data.id || Date.now().toString();
        this.title = data.title || '';
        this.date = data.date || '';
        this.time = data.time || '';
        this.description = data.description || '';
        this.category = data.category || 'personal';
        this.color = data.color || '#3b82f6';
    }

    /**
     * Оновлює властивості події новими даними
     * @param {Object} newData - Об'єкт з новими даними
     */
    update(newData) {
        if (newData.title !== undefined) this.title = newData.title;
        if (newData.date !== undefined) this.date = newData.date;
        if (newData.time !== undefined) this.time = newData.time;
        if (newData.description !== undefined) this.description = newData.description;
        if (newData.category !== undefined) this.category = newData.category;
        if (newData.color !== undefined) this.color = newData.color;
    }

    /**
     * Перетворює об'єкт події у JSON-рядок для збереження
     * @returns {string} JSON-рядок
     */
    toJSON() {
        return JSON.stringify({
            id: this.id,
            title: this.title,
            date: this.date,
            time: this.time,
            description: this.description,
            category: this.category,
            color: this.color
        });
    }

    /**
     * Створює об'єкт CalendarEvent з JSON-рядка
     * @param {string} json - JSON-рядок
     * @returns {CalendarEvent} Новий екземпляр події
     */
    static fromJSON(json) {
        const data = JSON.parse(json);
        return new CalendarEvent(data);
    }
}

/**
 * Основний клас додатку календаря
 * Керує відображенням, подіями та взаємодією з користувачем
 */
class CalendarApp {
    constructor() {
        // Масив подій
        this.events = [];

        // Поточна дата для відображення
        this.currentDate = new Date();

        // Формат дати для localStorage
        this.storageKey = 'calendarEvents';

        // DOM елементи
        this.calendarGrid = document.getElementById('calendarGrid');
        this.currentMonthElement = document.getElementById('currentMonth');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.eventForm = document.getElementById('eventForm');
        this.modalTitle = document.getElementById('modalTitle');
        this.deleteBtn = document.getElementById('deleteEventBtn');
        this.toast = document.getElementById('toast');
        this.toastMessage = document.getElementById('toastMessage');

        // Ініціалізація додатку
        this.init();
    }

    /**
     * Ініціалізує додаток: завантажує події, налаштовує обробники подій
     */
    init() {
        // Завантаження подій з localStorage
        this.loadFromLocalStorage();

        // Налаштування обробників подій
        this.setupEventListeners();

        // Початковий рендер календаря
        this.renderCalendar();
    }

    /**
     * Налаштовує всі обробники подій для елементів інтерфейсу
     */
    setupEventListeners() {
        // Навігація по місяцях
        document.getElementById('prevMonth').addEventListener('click', () => this.navigateMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.navigateMonth(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // Модальне вікно
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });

        // Форма події
        this.eventForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.deleteBtn.addEventListener('click', () => this.handleDeleteEvent());

        // Валідація форми
        document.getElementById('eventTitle').addEventListener('input', () => {
            this.validateField('eventTitle');
        });

        // ESC для закриття модального вікна
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalOverlay.classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    /**
     * Переходить до попереднього або наступного місяця
     * @param {number} direction - Напрямок (-1 або 1)
     */
    navigateMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    /**
     * Переходить до поточного місяця
     */
    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    /**
     * Відображає календар у поточному місяці
     */
    renderCalendar() {
        // Оновлення заголовка з назвою місяця
        this.updateMonthDisplay();

        // Очищення сітки
        this.calendarGrid.innerHTML = '';

        // Отримання інформації про місяць
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Перший день місяця (0 = неділя, але ми хочемо понеділок)
        const firstDay = new Date(year, month, 1);
        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

        // Кількість днів у місяці
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Кількість днів у попередньому місяці
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Загальна кількість клітинок (завжди 35 або 42)
        const totalCells = Math.ceil((startingDay + daysInMonth) / 7) * 7;

        // Сьогоднішня дата для порівняння
        const today = new Date();
        const todayDateStr = this.formatDateForCompare(today);

        // Генерація клітинок
        for (let i = 0; i < totalCells; i++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'calendar-day';

            // Визначаємо дату для поточної клітинки
            let cellDate;
            let isCurrentMonth = true;

            if (i < startingDay) {
                // Дні попереднього місяця
                cellDate = new Date(year, month - 1, daysInPrevMonth - startingDay + i + 1);
                isCurrentMonth = false;
            } else if (i >= startingDay + daysInMonth) {
                // Дні наступного місяця
                cellDate = new Date(year, month + 1, i - startingDay - daysInMonth + 1);
                isCurrentMonth = false;
            } else {
                // Дні поточного місяця
                cellDate = new Date(year, month, i - startingDay + 1);
            }

            // Форматування дати для атрибуту
            const cellDateStr = this.formatDate(cellDate);

            // Додавання класів
            if (!isCurrentMonth) {
                dayCell.classList.add('other-month');
            }

            if (cellDateStr === todayDateStr) {
                dayCell.classList.add('today');
            }

            // Додавання номера дня
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = cellDate.getDate();
            dayCell.appendChild(dayNumber);

            // Контейнер для подій
            const dayEvents = document.createElement('div');
            dayEvents.className = 'day-events';

            // Отримання подій для цієї дати
            const eventsForDay = this.getEventsForDate(cellDateStr);

            // Сортування подій за часом
            eventsForDay.sort((a, b) => {
                if (!a.time && !b.time) return 0;
                if (!a.time) return 1;
                if (!b.time) return -1;
                return a.time.localeCompare(b.time);
            });

            // Додавання подій до клітинки
            eventsForDay.forEach(event => {
                const eventElement = this.createEventElement(event);
                dayEvents.appendChild(eventElement);
            });

            dayCell.appendChild(dayEvents);

            // Обробник кліку на клітинку для додавання події
            dayCell.addEventListener('click', (e) => {
                // Перевіряємо, що клік був не на існуючій події (вони мають свій обробник)
                if (!e.target.classList.contains('event-item') &&
                    !e.target.closest('.event-item')) {
                    this.openModalForNewEvent(cellDateStr);
                }
            });

            this.calendarGrid.appendChild(dayCell);
        }
    }

    /**
     * Оновлює відображення поточного місяця та року
     */
    updateMonthDisplay() {
        const months = [
            'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
        ];

        const monthName = months[this.currentDate.getMonth()];
        const year = this.currentDate.getFullYear();
        this.currentMonthElement.textContent = `${monthName} ${year}`;
    }

    /**
     * Форматує дату у рядок YYYY-MM-DD
     * @param {Date} date - Об'єкт Date
     * @returns {string} Відформатована дата
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Форматує дату для порівняння (без часу)
     * @param {Date} date - Об'єкт Date
     * @returns {string} Дата у форматі YYYY-MM-DD
     */
    formatDateForCompare(date) {
        return this.formatDate(date);
    }

    /**
     * Отримує всі події для заданої дати
     * @param {string} dateStr - Дата у форматі YYYY-MM-DD
     * @returns {Array} Масив подій
     */
    getEventsForDate(dateStr) {
        return this.events.filter(event => event.date === dateStr);
    }

    /**
     * Створює DOM-елемент для події
     * @param {CalendarEvent} event - Об'єкт події
     * @returns {HTMLElement} Елемент події
     */
    createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = `event-item event-${event.category}`;
        eventElement.style.backgroundColor = event.color;
        eventElement.dataset.eventId = event.id;

        if (event.time) {
            const timeSpan = document.createElement('span');
            timeSpan.className = 'event-time';
            timeSpan.textContent = event.time;
            eventElement.appendChild(timeSpan);
        }

        const titleSpan = document.createElement('span');
        titleSpan.textContent = event.title;
        eventElement.appendChild(titleSpan);

        // Обробник кліку для редагування події
        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openModalForEdit(event);
        });

        return eventElement;
    }

    /**
     * Відкриває модальне вікно для створення нової події
     * @param {string} dateStr - Дата події
     */
    openModalForNewEvent(dateStr) {
        this.modalTitle.textContent = 'Додати подію';
        this.deleteBtn.classList.add('hidden');
        this.eventForm.reset();

        document.getElementById('eventId').value = '';
        document.getElementById('eventDate').value = dateStr;

        // Встановлення категорії за замовчуванням
        document.getElementById('eventCategory').value = 'personal';

        // Встановлення кольору за замовчуванням
        const defaultColor = document.querySelector('input[name="eventColor"][value="#3b82f6"]');
        if (defaultColor) defaultColor.checked = true;

        this.modalOverlay.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    /**
     * Відкриває модальне вікно для редагування події
     * @param {CalendarEvent} event - Об'єкт події
     */
    openModalForEdit(event) {
        this.modalTitle.textContent = 'Редагувати подію';
        this.deleteBtn.classList.remove('hidden');

        document.getElementById('eventId').value = event.id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventCategory').value = event.category;

        // Встановлення кольору
        const colorInput = document.querySelector(`input[name="eventColor"][value="${event.color}"]`);
        if (colorInput) colorInput.checked = true;

        // Видаляємо клас помилки, якщо він був
        document.getElementById('eventTitle').parentElement.classList.remove('has-error');

        this.modalOverlay.classList.add('active');
        document.getElementById('eventTitle').focus();
    }

    /**
     * Закриває модальне вікно
     */
    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.eventForm.reset();
        document.getElementById('eventTitle').parentElement.classList.remove('has-error');
    }

    /**
     * Обробляє відправку форми (створення або редагування події)
     * @param {Event} e - Подія відправки форми
     */
    handleFormSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('eventTitle').value.trim();
        const date = document.getElementById('eventDate').value;
        const time = document.getElementById('eventTime').value;
        const description = document.getElementById('eventDescription').value.trim();
        const category = document.getElementById('eventCategory').value;
        const colorInput = document.querySelector('input[name="eventColor"]:checked');
        const color = colorInput ? colorInput.value : '#3b82f6';

        // Валідація назви
        if (!title) {
            document.getElementById('eventTitle').parentElement.classList.add('has-error');
            return;
        }

        const eventId = document.getElementById('eventId').value;

        if (eventId) {
            // Редагування існуючої події
            this.editEvent(eventId, { title, date, time, description, category, color });
            this.showToast('Подію оновлено');
        } else {
            // Створення нової події
            this.addEvent({ title, date, time, description, category, color });
            this.showToast('Подію додано');
        }

        this.closeModal();
    }

    /**
     * Обробляє видалення події
     */
    handleDeleteEvent() {
        const eventId = document.getElementById('eventId').value;

        if (eventId && confirm('Ви впевнені, що хочете видалити цю подію?')) {
            this.deleteEvent(eventId);
            this.showToast('Подію видалено');
            this.closeModal();
        }
    }

    /**
     * Валідує окреме поле форми
     * @param {string} fieldId - ID поля
     */
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const parent = field.parentElement;

        if (fieldId === 'eventTitle' && !field.value.trim()) {
            parent.classList.add('has-error');
        } else {
            parent.classList.remove('has-error');
        }
    }

    /**
     * Додає нову подію
     * @param {Object} eventData - Дані події
     */
    addEvent(eventData) {
        const newEvent = new CalendarEvent(eventData);
        this.events.push(newEvent);
        this.saveToLocalStorage();
        this.renderCalendar();
    }

    /**
     * Редагує існуючу подію
     * @param {string} id - ID події
     * @param {Object} newData - Нові дані
     */
    editEvent(id, newData) {
        const event = this.events.find(e => e.id === id);
        if (event) {
            event.update(newData);
            this.saveToLocalStorage();
            this.renderCalendar();
        }
    }

    /**
     * Видаляє подію за ID
     * @param {string} id - ID події
     */
    deleteEvent(id) {
        this.events = this.events.filter(e => e.id !== id);
        this.saveToLocalStorage();
        this.renderCalendar();
    }

    /**
     * Зберігає події у localStorage
     */
    saveToLocalStorage() {
        try {
            const eventsData = this.events.map(event => ({
                id: event.id,
                title: event.title,
                date: event.date,
                time: event.time,
                description: event.description,
                category: event.category,
                color: event.color
            }));
            localStorage.setItem(this.storageKey, JSON.stringify(eventsData));
        } catch (error) {
            console.error('Помилка збереження у localStorage:', error);
            this.showToast('Помилка збереження даних');
        }
    }

    /**
     * Завантажує події з localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const eventsData = JSON.parse(savedData);
                this.events = eventsData.map(data => new CalendarEvent(data));
            }
        } catch (error) {
            console.error('Помилка завантаження з localStorage:', error);
            this.showToast('Помилка завантаження даних');
        }
    }

    /**
     * Показує toast-повідомлення
     * @param {string} message - Текст повідомлення
     */
    showToast(message) {
        this.toastMessage.textContent = message;
        this.toast.classList.add('show');

        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Ініціалізація додатку при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
    new CalendarApp();
});
