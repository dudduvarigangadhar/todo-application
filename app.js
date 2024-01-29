const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken");
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

const hasStatusProperties = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperties = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperties = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryProperties = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { status, search_q = "", priority, category } = request.query;
  let getTodosQuery = "";
  let statusText = null;
  switch (true) {
    case hasStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE status = '${status}' AND todo LIKE '%${search_q}%';`;
      statusText = "Status";
      break;
    case hasPriorityProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND todo LIKE '%${search_q}';`;
      statusText = "Priority";
      break;
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE priority = '${priority}' AND status = '${status}';`;

      break;
    case hasSearchProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND status = '${status}';`;
      break;
    case hasCategoryProperties(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}';`;
      statusText = "Status";
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE category = '${category}' AND priority = '${priority}';`;
      break;
    default:
      break;
  }

  const dbResponse = await db.get(getTodosQuery);
  if (dbResponse === undefined) {
    response.status(400);
    response.send(`Invalid Todo '${statusText}'`);
  } else {
    response.send(dbResponse);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT * FROM todo WHERE id ='${todoId}';`;
  const dbResponse = await db.get(getQuery);
  response.send(dbResponse);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let newDate = new Date(date);

  var result = format(new Date(newDate), "yyyy/MM/dd");
  let valid = isValid(result);
  console.log(valid);
  //   if (newDate) {
  //     const getQuery = `SELECT * FROM todo WHERE dueDate = '${newDate}';`;
  //     const dbResponse = await db.get(getQuery);
  //     response.send(dbResponse);
  //   }
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

// app.put("todos/:todoId",(request,response) => {

// })

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
