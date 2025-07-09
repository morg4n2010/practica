-- Убедитесь, что в начале файла указана кодировка
SET client_encoding = 'UTF8';

-- Удаляем существующую таблицу (если нужно)
DROP TABLE IF EXISTS employees;

-- Создаем таблицу заново с явным указанием кодировки
CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    login VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Вставляем данные с явным указанием кодировки
INSERT INTO employees (id, first_name, last_name, phone, email, login, created_at) VALUES
(1, 'Иван', 'Иванов', '+79991234567', 'ivan@example.com', 'ivanov', '2023-01-01 10:00:00'),
(2, 'Петр', 'Петров', '+79998765432', 'petr@example.com', 'petrov', '2023-01-02 11:00:00'),
(3, 'Анна', 'Сидорова', '+79997654321', 'anna@example.com', 'sidorova', '2023-01-03 12:00:00');

-- Если у вас больше данных, продолжайте в том же формате