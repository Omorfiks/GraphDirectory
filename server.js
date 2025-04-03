import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import fs from "fs"; // Для работы с файловой системой
import path from "path"; // Для работы с путями
import { fileURLToPath } from "url";
import mime from "mime-types";
const app = express();
const port = 3000;

// Получаем путь к текущей директории
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Создаем путь к директории для хранения файлов
const filesStoragePath = path.join(__dirname, "filesstorage");

// Создаем директорию, если она не существует
if (!fs.existsSync(filesStoragePath)) {
  fs.mkdirSync(filesStoragePath, { recursive: true });
  console.log("Директория для файлов создана:", filesStoragePath);
}

// Подключаем middleware CORS
app.use(cors({
  origin: "*", // Разрешить запросы со всех доменов
  methods: ["GET", "POST", "DELETE"], // Разрешенные методы
  allowedHeaders: ["Content-Type"], // Разрешенные заголовки
}));

// Подключаем middleware для парсинга JSON-данных
app.use(express.json());
// Middleware для установки заголовков Cache-Control
app.use((req, res, next) => {
  const mimeType = mime.lookup(req.path);
  console.log("req.path:", 123);  
  // Установка заголовков кэширования
  if (mimeType === "application/pdf") {
    res.setHeader("Cache-Control", "public, max-age=86400"); // Кэшировать PDF на 24 часа
  } else if (mimeType === "text/plain") {
    res.setHeader("Cache-Control", "public, max-age=3600"); // Кэшировать TXT на 1 час
  } else {
    res.setHeader("Cache-Control", "public, max-age=3600"); // Общий случай
  }

  next();
});

// Маршрут для доступа к файлам с кэшированием
app.use("/filesstorage", express.static(filesStoragePath, {
  maxAge: "1h", // Кэшировать все файлы на 1 час
}));
// Middleware для обслуживания статических файлов PDF.js
app.use("/pdfjs", express.static(path.join(__dirname, "public/pdfjs")));

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
    console.log("jsonData - ", jsonData);

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

    // Проверяем, что обязательные поля существуют
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
    // Преобразуем ID в число
    const nodeId = parseInt(id, 10);

    if (isNaN(nodeId)) {
      return res.status(400).json({ error: "Неверный формат ID" });
    }

    // Проверяем, существует ли узел с указанным ID
    const checkNodeQuery = "SELECT id FROM tree WHERE id = ?";
    const nodeExists = db.prepare(checkNodeQuery).get(nodeId);

    if (!nodeExists) {
      return res.status(404).json({ error: "Узел с указанным ID не найден" });
    }

    // Рекурсивное удаление узлов
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

    deleteRecursive(nodeId);

    // Обновляем файл treeData.json
    updateTreeDataFile();

    res.status(200).json({ message: "Узел успешно удален" });
  } catch (error) {
    console.error("Ошибка при удалении узла:", error);
    res.status(500).json({ error: "Не удалось удалить узел" });
  }
});

// Маршрут для обновления файла treeData.json и БД
app.get("/update-tree", (req, res) => {
  try {
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

    // Путь к папке filesstorage
    const filesStoragePath = path.join(
      "C:",
      "Users",
      "Роман",
      "Desktop",
      "Пэты",
      "GraphDirectory",
      "filesstorage"
    );

    // Функция для сканирования директории
    function scanDirectory(directoryPath) {
      const items = fs.readdirSync(directoryPath, { withFileTypes: true });

      return items.map((item) => {
        const fullPath = path.join(directoryPath, item.name);

        if (item.isDirectory()) {
          // Если это папка, рекурсивно сканируем её содержимое
          return {
            name: item.name,
            type: "folder",
            children: scanDirectory(fullPath),
          };
        } else {
          // Если это файл, добавляем его как элемент типа "file"
          return {
            name: item.name,
            type: "file",
            children: [],
          };
        }
      });
    }

    // Функция для добавления данных в treeData.json
    function updateTreeData() {
      try {
        // Загружаем текущие данные из treeData.json
        const currentData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Сканируем папку filesstorage
        const filesStorageContent = scanDirectory(filesStoragePath);

        // Добавляем содержимое filesstorage в корень treeData.json
        currentData.push({
          id: currentData.length, // Генерируем уникальный ID
          name: "filesstorage",
          type: "folder",
          children: filesStorageContent,
        });

        // Записываем обновленные данные обратно в treeData.json
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2), "utf-8");

        console.log("Файл treeData.json успешно обновлен");

        // Обновляем БД на основе treeData.json
        updateDatabaseFromTreeData(currentData);
      } catch (error) {
        console.error("Ошибка при обновлении файла treeData.json:", error);
      }
    }

    // Функция для обновления БД на основе treeData.json
    function updateDatabaseFromTreeData(treeData) {
      try {
        // Очищаем таблицу tree перед обновлением
        db.exec("DELETE FROM tree;");

        // Рекурсивная функция для добавления узлов в БД
        function addNodesToDB(nodes, parentId = null) {
          nodes.forEach((node) => {
            const insertQuery = `
              INSERT INTO tree (name, type, parentId)
              VALUES (?, ?, ?)
            `;
            const result = db.prepare(insertQuery).run(node.name, node.type, parentId);

            // Если у узла есть дочерние элементы, добавляем их рекурсивно
            if (node.children && node.children.length > 0) {
              addNodesToDB(node.children, result.lastInsertRowid);
            }
          });
        }

        // Добавляем все узлы из treeData в БД
        addNodesToDB(treeData);

        console.log("База данных успешно обновлена");
      } catch (error) {
        console.error("Ошибка при обновлении базы данных:", error);
      }
    }

    // Запускаем обновление
    updateTreeData();
    res.json({ message: "Файл treeData.json и база данных успешно обновлены" });
  } catch (error) {
    console.error("Ошибка при обновлении файла treeData.json или базы данных:", error);
    res.status(500).json({ error: "Не удалось обновить файл или базу данных" });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});