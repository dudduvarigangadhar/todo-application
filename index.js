const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const toDate = require("date-fns/toDate");
app.use(express.json());
let db = null;

const initialDBAndServer = async () => {
  try {
    db = await open({
      filename: path.join(__dirname, "todoApplication.db"),
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(-1);
  }
};

initialDBAndServer();
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const haspriorityPrperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hascategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const checkValid = (request, response, next) => {
  const { status, priority, category, due_date } = request.query;
  statusContainer = ["TO DO", "IN PROGRESS", "DONE"];
  priorityContainer = ["HIGH", "MEDIUM", "LOW"];
  categoryContainer = ["WORK", "HOME", "LEARNING"];
  console.log(priorityContainer.includes(priority));
  if (status !== undefined) {
    if (statusContainer.includes(status)) {
      request.status = status;
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
      return;
    }
  }

  if (priority !== undefined) {
    if (priorityContainer.includes(priority)) {
      request.priority = priority;
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
      return;
    }
  }

  if (category !== undefined) {
    if (categoryContainer.includes(category)) {
      request.category = category;
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
      return;
    }
  }
  next();
};
app.get("/todos/", checkValid, async (request, response) => {
  let getQuery = null;
  let dbResponse = null;
  const { todo, priority, status, category, dueDate } = request.query;
  switch (true) {
    case hasStatusProperty(request.query):
      //   console.log(status);
      getQuery = `SELECT  id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE status = '${status}';`;
      dbResponse = await db.all(getQuery);
      response.send(dbResponse);
      break;

    case haspriorityPrperty(request.query):
      getQuery = `SELECT  id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE priority = '${priority}';`;
      dbResponse = await db.all(getQuery);
      response.send(dbResponse);
      break;

    case hascategoryProperty(request.query):
      getQuery = `SELECT  id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE category = '${category}';`;
      dbResponse = await db.all(getQuery);
      response.send(dbResponse);
      break;
  }
});

module.exports = app;
