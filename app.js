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

const checkRequestQueries = (request, response, next) => {
  const { search_q, id, todo, category, priority, status } = request.body;
  const { todoId } = request.params;
  const { date } = request.query;
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

  if (date !== undefined) {
    const myDate = new Date(date);
    const formatedDate = format(new Date(date), "yyyy-MM-dd");
    console.log(formatedDate);
    const result = toDate(
      new Date(
        `${myDate.getFullYear()}-${myDate.getMonth() + 1}-${myDate.getDate()}`
      )
    );
    console.log("result", result);
    console.log(new Date(), "new");
    const isValidDate = isValid(result);
    console.log(isValidDate, "v");
    if (isValidDate) {
      request.date = formatedDate;
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }

  next();
};
app.get("/todos/", async (request, response) => {
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
                                due_date AS dueDate  
                        FROM 
                            todo
                        WHERE 
                        todo LIKE '%${search_q}%' AND priority LIKE '%${priority}%'
                        AND status LIKE '%${status}%' AND category LIKE '%${category}%';`;

  const dbResponse = await db.all(getTodosQuery);
  console.log(dbResponse.length);
  switch (true) {
    case status !== undefined:
      console.log(status);
      if (dbResponse.length === 0 && status !== undefined) {
        response.status(400);
        response.send("Invalid Todo Status");
        return;
      } else {
        response.send(dbResponse);
        return;
      }
      break;
    case priority !== undefined:
      console.log(priority);
      if (dbResponse.length === 0 && priority !== undefined) {
        response.status(400);
        response.send("Invalid Todo Priority");
        return;
      } else {
        response.send(dbResponse);
        return;
      }
      break;
    case category !== undefined:
      if (dbResponse.length === 0 && category !== undefined) {
        response.status(400);
        response.send("Invalid Todo Category");
        return;
      } else {
        response.send(dbResponse);
      }
      break;
  }
});

app.get("/agenda/", checkRequestQueries, async (request, response) => {
  const { date } = request.query;
  //   console.log(date);
  const getDate = `SELECT * FROM todo 
WHERE due_date = '${date}';`;
  const dbResponse = await db.all(getDate);
  response.send(dbResponse);
});

app.get("/todos/:todoId/", checkRequestQueries, async (request, response) => {
  const { todoId } = request.params;
  const getQuery = `SELECT id,
                    todo,
                    priority,
                    status,
                    category,
                    due_date AS dueDate                      
  FROM todo WHERE id ='${todoId}';`;

  const dbResponse = await db.get(getQuery);
  //   if(dbResponse === undefined){
  //       response.status(400);
  //       response.send()
  //   }
  //   console.log(dbResponse);
  response.send(dbResponse);
});

app.post("/todos/", checkRequestQueries, async (request, response) => {
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

const requestBody = (request, response, next) => {
  const { status, priority, todo, category, dueDate } = request.body;
  const { todoId } = request.params;
  console.log(dueDate);
  if (status !== undefined) {
    statusArray = ["TO DO", "IN PROGRESS", "DONE"];
    statusInArray = statusArray.includes(status);
    if (statusInArray === true) {
      request.status = status;
    } else {
      console.log(status);
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
      console.log(priority);
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }

  if (dueDate !== undefined) {
    const myDate = new Date(dueDate);
    console.log(myDate, "p");
    // if (myDate === Invalid Date) {
    //   response.status(400);
    //   response.send("Invalid Due Date");
    //   return;
    // }
    const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
    console.log(formatedDate, "f");
    const result = toDate(new Date(formatedDate));
    const isValidDate = isValid(result);
    console.log("valid" + " " + isValidDate);
    if (isValidDate) {
      request.due_date = formatedDate;
      console.log(request.due_date);
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
    // try {
    //   if (isValidDate !== true) {
    //     request.dueDate = formatedDate;
    //   } else {
    //     response.status(400);
    //     response.send("Invalid Due Date");
    //     return;
    //   }
    // } catch (e) {
    //   response.status(400);
    //   response.send("Invalid Due Date");
    //   return;
    // }
  }

  if (category !== undefined) {
    categoryArray = ["WORK", "HOME", "LEARNING"];
    categoryIsArray = categoryArray.includes(category);
    if (categoryIsArray) {
      request.category = category;
    } else {
      console.log(category);
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }

  //   if (dueDate !== undefined) {
  //     try {
  //       const myDate = new Date(dueDate);
  //       const formatedDate = format(new Date(dueDate), "yyyy-MM-dd");
  //       console.log(formatedDate);
  //     }
  //   }
  request.todo = todo;
  //   request.id = id;
  request.todoId = todoId;
  next();
};
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id = '${todoId}';`;
  const dbResponse = await db.run(deleteQuery);
  response.send("Todo Deleted");
});
// app.put("/todo/:todoId/",requestBody, async (request,response) => {
//      const { status, priority, todo, category, due_date } = request.body;
//      const { todoId } = request.params;
//   let updateQuery = null;

// })
app.put("/todos/:todoId/", requestBody, async (request, response) => {
  const { status, priority, todo, category, dueDate } = request.body;
  console.log("due_date ", dueDate);
  const { todoId } = request.params;
  let updateQuery = null;
  let dbResponse = null;
  switch (true) {
    case status !== undefined:
      updateQuery = `UPDATE todo SET status = '${status}' WHERE id = '${todoId}';`;
      dbResponse = await db.run(updateQuery);
      console.log(dbResponse);
      response.send("Status Updated");
      break;

    case priority !== undefined:
      updateQuery = `UPDATE todo SET priority = '${priority}' WHERE id = '${todoId}';`;
      dbResponse = await db.run(updateQuery);
      console.log(dbResponse);
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
    case dueDate !== undefined:
      const updateDateQuery = `
        UPDATE todo 
        SET due_date = '${dueDate}'
        WHERE id= ${todoId};
        `;
      const todosArray = await db.run(updateDateQuery);
      if (todosArray === undefined) {
        response.status(400);
        response.send("Invalid Due Date");
        return;
      } else {
        response.send("Due Date Updated");
      }
      break;
  }
});

module.exports = app;
