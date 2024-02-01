const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const dbpath = path.join(__dirname, "todoApplication.db");
const app = express();

app.use(express.json());
let db = null;

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};

initialDBAndServer();

const checkRequestQueries = (request, response, next) => {
  const { search_q, id, todo, category, priority, status } = request.body;
  const { todoId } = request.params;
  const { date } = request.query;
  console.log(date);
  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    isStatus = statusArray.includes(status);
    if (isStatus) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    priorityArray = ["HIGH", "LOW", "MEDIUM"];
    isPriority = priorityArray.includes(priority);
    if (isPriority) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    isCategory = categoryArray.includes(category);
    if (isCategory) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }

  next();
};
app.get("/todos/", checkRequestQueries, async (request, response) => {
  const {
    status = "",
    search_q = "",
    priority = "",
    category = "",
  } = request.query;
  console.log(status, search_q, priority, category);
  let getTodosQuery = `SELECT id,
                                todo,
                                priority,
                                status,
                                category,
                                due_date  
                        FROM 
                            todo
                        WHERE 
                        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
                        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const dbResponse = await db.all(getTodosQuery);
  response.send(dbResponse);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id ='${todoId}';`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(id, todo, priority, status, category, dueDate);

  const setTodoQuery = `
    INSERT INTO 
        todo(id,todo,priority,status,category,due_date)
    VALUES(
        '${id}',
        '${todo}',
        '${priority}',
        '${status}',
        '${category}',
        '${dueDate}'
    )`;
  await db.run(setTodoQuery);
  response.send("Todo Successfully Added");
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

const requestBody = (request, response, next) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  console.log(category);
  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (priority !== undefined) {
    priorityArray = ["HIGH", "LOW", "MEDIUM"];
    priorityIsArray = priorityArray.includes(priority);
    if (priorityIsArray === true) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsArray = categoryArray.includes(category);
    if (categoryIsArray) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
    request.todo = todo;
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate);
      const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
      console.log(formatedDate);
    }
  }
  next();
};
app.put("/todos/:todoId/", requestBody, async (request, response) => {
  const { status, priority, todo, category, due_date } = request.body;
  console.log(due_date);
  const { todoId } = request.params;
  let updateQuery = null;
  switch (true) {
    case status !== undefined:
      updateQuery = `UPDATE todo SET status = '${status}' WHERE id = '${todoId}';`;
      await db.run(updateQuery);
      response.send("Status Updated");
      break;

    case priority !== undefined:
      updateQuery = `UPDATE todo SET priority = '${priority}' WHERE id = '${todoId}';`;
      await db.run(updateQuery);
      response.send("Priority Updated");
      break;

    case category !== undefined:
      updateQuery = `UPDATE todo SET category = '${category}' WHERE id = '${todoId}';`;
      await db.run(updateQuery);
      response.send("Category Updated");
      break;

    case todo !== undefined:
      updateQuery = `UPDATE todo SET todo = '${todo}' WHERE id = '${todoId}';`;
      await db.run(updateQuery);
      response.send("Todo Updated");
      break;
  }
});

module.exports = app;
