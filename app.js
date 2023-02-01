const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const app = express();
app.use(express.json());

const port = 3000;
dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
// Server initialization
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(port, () =>
      console.log("Server Listening at http://localhost:3000")
    );
  } catch (err) {
    console.log(`DB error: ${err.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1 get todo s by query parameters

app.get("/todos/", async (request, response) => {
  const {
    status = "",
    priority = "",
    category = "",
    search_q = "",
  } = request.query;
  if (
    !(
      status === "TO DO" ||
      status === "" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    !(
      priority === "HIGH" ||
      priority === "" ||
      priority === "LOW" ||
      priority === "MEDIUM"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    !(
      category === "WORK" ||
      category === "" ||
      category === "HOME" ||
      category === "LEARNING"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    const getTodoByStatusQuery = `SELECT id,
    todo,
    priority,
    status,
    category,
    due_date As dueDate FROM todo 
    WHERE status LIKE "%${status}%"AND
     priority LIKE "%${priority}%" AND
      category LIKE "%${category}%"AND
       todo LIKE "%${search_q}%";`;
    const todoArray = await db.all(getTodoByStatusQuery);
    response.send(todoArray);
  }
});

//API 2 get todo by id
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const getTodoByIdQuery = `SELECT id,
    todo,
    priority,
    status,
    category,
    due_date As dueDate 
    FROM todo 
    WHERE
    id=${todoId};
    `;
  const todoWithId = await db.get(getTodoByIdQuery);
  response.send(todoWithId);
});

//API 3 get todo by due date

app.get("/agenda/", async (request, response) => {
  const dueDate = request.query.date;
  const splitDueDate = dueDate
    .split("-")
    .map((forEachEl) => parseInt(forEachEl));
  let [year, month, date] = splitDueDate;

  if (isValid(new Date(year, month, date))) {
    // If date is valid
    const formattedDate = format(new Date(year, month - 1, date), "yyyy-MM-dd");
    const getTodoQuery = `
			SELECT
				id,
				todo,
				priority,
				status,
				category,
				due_date AS dueDate
			FROM
				todo
			WHERE
				due_date = "${formattedDate}";`;

    const todoArray = await db.all(getTodoQuery);
    response.send(todoArray);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4 Insert todo

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const newDate = dueDate.split("-").map((eachItem) => parseInt(eachItem));
  const [year, month, date] = newDate;
  if (
    !(
      status === "TO DO" ||
      status === "" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    !(
      priority === "HIGH" ||
      priority === "" ||
      priority === "LOW" ||
      priority === "MEDIUM"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    !(
      category === "WORK" ||
      category === "" ||
      category === "HOME" ||
      category === "LEARNING"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!isValid(new Date(year, month, date))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(year, month - 1, date), "yyyy-MM-dd");
    const addTodoQuery = `
    INSERT INTO 
        todo(id,todo,priority,status,category,due_date)
    VALUES(
          ${id},
          "${todo}",
          "${priority}",
          "${status}",
          "${category}",
          "${formattedDate}");`;
    await db.run(addTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//update todo
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getPreviousTodoQuery = `SELECT * FROM todo WHERE id=${todoId};`;
  let previousTodo = await db.get(getPreviousTodoQuery);
  let {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.due_date,
  } = request.body;
  const newDate = dueDate.split("-").map((eachItem) => parseInt(eachItem));
  const [year, month, date] = newDate;
  if (
    !(
      status === "TO DO" ||
      status === "" ||
      status === "IN PROGRESS" ||
      status === "DONE"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else if (
    !(
      priority === "HIGH" ||
      priority === "" ||
      priority === "LOW" ||
      priority === "MEDIUM"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else if (
    !(
      category === "WORK" ||
      category === "" ||
      category === "HOME" ||
      category === "LEARNING"
    )
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else if (!isValid(new Date(year, month, date))) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const formattedDate = format(new Date(year, month - 1, date), "yyyy-MM-dd");
    const updateTodoQuery = `
   UPDATE 
        todo
    SET
          todo="${todo}",
          priority="${priority}",
          status="${status}",
          category="${category}",
          due_date="${formattedDate}"
    WHERE
        id=${todoId};`;
    let message = null;
    if (request.body.status !== undefined) {
      message = "Status";
    } else if (request.body.priority !== undefined) {
      message = "Priority";
    } else if (request.body.category !== undefined) {
      message = "Category";
    } else if (request.body.todo !== undefined) {
      message = "Todo";
    } else if (request.body.dueDate !== undefined) {
      message = "Due Date";
    }
    await db.run(updateTodoQuery);
    response.send(`${message} Updated`);
  }
});

//API 6 delete todo based on id

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
