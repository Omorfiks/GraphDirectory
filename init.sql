-- Создание таблицы tree
CREATE TABLE IF NOT EXISTS tree (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parentId INTEGER,
  FOREIGN KEY (parentId) REFERENCES tree(id)
);

-- Добавление тестовых данных
INSERT INTO tree (id, name, type, parentId) VALUES
(0, 'src', 'folder', NULL),
(1, 'components', 'folder', 0),
(2, 'FileTree.vue', 'file', 1),
(3, 'TreeNode.vue', 'file', 1),
(4, 'App.vue', 'file', 0),
(5, 'main.js', 'file', 0);