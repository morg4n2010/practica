require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Настройка CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// Подключение к PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'employee_db',
    password: process.env.DB_PASSWORD || 'postgres',
    port: process.env.DB_PORT || 5432
});

// Проверка подключения при старте
pool.query('SELECT NOW()')
    .then(() => console.log('✅ Подключение к PostgreSQL успешно!'))
    .catch(err => console.error('❌ Ошибка подключения:', err));

// Middleware для логгирования
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Проверка структуры БД
app.get('/api/check-db', async (req, res) => {
    try {
        // Проверяем существование таблицы и столбцов
        const { rows } = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
        `);
        
        const requiredColumns = ['id', 'first_name', 'last_name', 'phone', 'email', 'login', 'created_at'];
        const missingColumns = requiredColumns.filter(col => 
            !rows.some(row => row.column_name === col)
        );

        if (missingColumns.length > 0) {
            throw new Error(`Отсутствуют столбцы: ${missingColumns.join(', ')}`);
        }

        res.json({
            status: 'OK',
            columns: rows,
            message: 'Структура таблицы employees корректна'
        });
    } catch (err) {
        console.error('Ошибка проверки БД:', err);
        res.status(500).json({
            status: 'ERROR',
            error: err.message,
            fixSuggestion: 'Выполните: DROP TABLE IF EXISTS employees; CREATE TABLE employees (...)'
        });
    }
});

// Получение всех сотрудников
app.get('/api/employees', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                id,
                first_name,
                last_name,
                phone,
                email,
                login,
                TO_CHAR(created_at, 'DD.MM.YYYY HH24:MI') as created_at
            FROM employees
            ORDER BY id
        `);
        res.json(rows);
    } catch (err) {
        console.error('Ошибка GET /api/employees:', err);
        res.status(500).json({ 
            error: 'Ошибка сервера',
            details: err.message
        });
    }
});

// Добавление сотрудника
app.post('/api/employees', async (req, res) => {
    try {
        const { first_name, last_name, phone, email, login } = req.body;

        // Валидация
        if (!first_name || !last_name || !phone || !email || !login) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        const { rows } = await pool.query(
            `INSERT INTO employees 
             (first_name, last_name, phone, email, login)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING 
                id,
                first_name,
                last_name,
                phone,
                email,
                login,
                TO_CHAR(created_at, 'DD.MM.YYYY HH24:MI') as created_at`,
            [first_name, last_name, phone, email, login]
        );

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Ошибка POST /api/employees:', err);
        
        if (err.code === '23505') { // Ошибка уникальности
            const detail = err.detail.includes('email') ? 'Email уже существует' : 'Логин уже существует';
            return res.status(400).json({ error: detail });
        }

        res.status(500).json({ 
            error: 'Ошибка при добавлении сотрудника',
            details: err.message 
        });
    }
});

// Удаление сотрудника
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { rowCount } = await pool.query(
            'DELETE FROM employees WHERE id = $1', 
            [id]
        );
        
        if (rowCount === 0) {
            return res.status(404).json({ error: 'Сотрудник не найден' });
        }
        
        res.status(204).end();
    } catch (err) {
        console.error('Ошибка DELETE /api/employees:', err);
        res.status(500).json({ 
            error: 'Ошибка при удалении',
            details: err.message
        });
    }
});

// Обработка несуществующих роутов
app.use((req, res) => {
    res.status(404).json({ error: 'Маршрут не найден' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
    console.error('Необработанное исключение:', err);
});