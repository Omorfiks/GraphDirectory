// server.js

import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "fs"; // Для работы с файловой системой
import path from "path"; // Для работы с путями

const app = express();
const port = 3000;

// Подключаем middleware CORS
app.use(cors());

// Подключаем middleware для парсинга JSON-данных
app.use(express.json());

// Путь к файлу базы данных SQLite
const dbPath = "./database.sqlite"; // Убедитесь, что файл находится в корне
const db = new Database(dbPath);

// Создание таблицы tree, если она не существует
function initializeDatabase() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS tree (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parentId INTEGER,
        FOREIGN KEY (parentId) REFERENCES tree(id)
      )
    `;
    db.exec(createTableQuery);
    console.log("Таблица 'tree' успешно создана или уже существует.");
  } catch (error) {
    console.error("Ошибка при создании таблицы:", error);
  }
}

// Инициализация базы данных
initializeDatabase();

// Функция для получения данных из БД
function fetchTreeDataFromDB() {
  try {
    const query = `
      SELECT id, name, type, parentId
      FROM tree
      ORDER BY parentId, id
    `;
    return db.prepare(query).all();
  } catch (error) {
    console.error("Ошибка при получении данных из БД:", error);
    throw error;
  }
}

// Функция для преобразования плоского массива в древовидную структуру
function buildTree(items, parentId = null) {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      id: item.id,
      name: item.name,
      type: item.type,
      children: buildTree(items, item.id),
    }));
}

// Функция для обновления файла treeData.json
function updateTreeDataFile() {
  try {
    const rows = fetchTreeDataFromDB();
    console.log(rows);
    
    const treeData = buildTree(rows);
    console.log("treeData - ", treeData);
    // Путь к файлу treeData.json
    const filePath = path.join(
      "C:",
      "Users",
      "Роман",
      "Desktop",
      "Пэты",
      "GraphDirectory",
      "src",
      "components",
      "App",
      "treeData.json"
    );

    // Преобразуем данные в строку JSON
    const jsonData = JSON.stringify(treeData || {}, null, 2); // Если данных нет, записываем пустой объект
    console.log("jsonData - ",jsonData);

    // Записываем данные в файл
    fs.writeFileSync(filePath, jsonData, "utf-8");

    console.log("Файл treeData.json успешно обновлен");
  } catch (error) {
    console.error("Ошибка при обновлении файла treeData.json:", error);
  }
}

// Маршрут для получения дерева
app.get("/api/tree-data", (req, res) => {
  try {
    const rows = fetchTreeDataFromDB();
    const treeData = buildTree(rows);
    res.json(treeData); // Возвращаем древовидную структуру
  } catch (error) {
    res.status(500).json({ error: "Не удалось получить данные из БД" });
  }
});

// Маршрут для добавления нового узла
app.post("/add-node", (req, res) => {
  try {
    const { name, type, parentId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: "Необходимо указать имя и тип узла" });
    }

    const insertQuery = `
      INSERT INTO tree (name, type, parentId)
      VALUES (?, ?, ?)
    `;
    const result = db.prepare(insertQuery).run(name, type, parentId);

    // Обновляем файл treeData.json
    updateTreeDataFile();

    res.json({ message: "Узел успешно добавлен", id: result.lastInsertRowid });
  } catch (error) {
    console.error("Ошибка при добавлении узла:", error);
    res.status(500).json({ error: "Не удалось добавить узел" });
  }
});

// Маршрут для удаления узла
app.delete("/api/delete-node/:id", (req, res) => {
  const { id } = req.params;

  try {
    // 1. Проверяем, существует ли узел с указанным ID
    const checkNodeQuery = "SELECT id FROM tree WHERE id = ?";
    const nodeExists = db.prepare(checkNodeQuery).get(id);

    if (!nodeExists) {
      return res.status(404).json({ error: "Узел с указанным ID не найден" });
    }

    // 2. Удаляем все дочерние узлы рекурсивно
    const deleteRecursive = (parentId) => {
      const childNodesQuery = "SELECT id FROM tree WHERE parentId = ?";
      const childNodes = db.prepare(childNodesQuery).all(parentId);

      childNodes.forEach((child) => {
        deleteRecursive(child.id); // Рекурсивно удаляем дочерние узлы
      });

      // Удаляем текущий узел
      const deleteNodeQuery = "DELETE FROM tree WHERE id = ?";
      db.prepare(deleteNodeQuery).run(parentId);
    };

    // Запускаем рекурсивное удаление
    deleteRecursive(parseInt(id));

    // 3. Обновляем файл treeData.json
    updateTreeDataFile();

    // 4. Возвращаем успешный ответ
    res.status(200).json({ message: "Узел успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении узла:", error);
    res.status(500).json({ error: "Не удалось удалить узел" });
  }
});

// Маршрут для обновления файла treeData.json
app.get("/update-tree", (req, res) => {
  try {
    updateTreeDataFile();
    res.json({ message: "Файл treeData.json успешно обновлен" });
  } catch (error) {
    console.error("Ошибка при обновлении файла treeData.json:", error);
    res.status(500).json({ error: "Не удалось обновить файл" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});