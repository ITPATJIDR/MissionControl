use sqlx::{sqlite::SqlitePool, Row};
use crate::types::{Todo, UpdateTodo};

pub async fn get_todos_by_project(project_id: i64, pool: &SqlitePool) -> Result<Vec<Todo>, String> {
    let rows = sqlx::query("SELECT id, text, completed, time, created_at, project_id FROM todos WHERE project_id = ? ORDER BY created_at ASC, id ASC")
        .bind(project_id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to fetch todos: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    let todos: Vec<Todo> = rows
        .into_iter()
        .map(|row| {
            let completed_int: i64 = row.get("completed");
            Todo {
                id: row.get("id"),
                text: row.get("text"),
                completed: completed_int != 0,
                time: row.get("time"),
                created_at: row.get("created_at"),
                project_id: row.get("project_id"),
            }
        })
        .collect();
    Ok(todos)
}

pub async fn create_new_todo(
    text: String,
    time: i32,
    project_id: i64,
    pool: &SqlitePool,
) -> Result<Todo, String> {
    let result = sqlx::query(
        "INSERT INTO todos (text, time, completed, project_id) VALUES (?, ?, 0, ?) RETURNING id, text, completed, time, created_at, project_id"
    )
    .bind(&text)
    .bind(time)
    .bind(project_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to create todo: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    let completed_int: i64 = result.get("completed");
    let new_todo = Todo {
        id: result.get("id"),
        text: result.get("text"),
        completed: completed_int != 0,
        time: result.get("time"),
        created_at: result.get("created_at"),
        project_id: result.get("project_id"),
    };

    Ok(new_todo)
}

pub async fn update_todo_by_id(id: i64, update: UpdateTodo, pool: &SqlitePool) -> Result<Todo, String> {
    // Build dynamic query based on what fields are being updated
    let mut query_builder = sqlx::QueryBuilder::new("UPDATE todos SET ");
    let mut first = true;

    if let Some(ref text) = update.text {
        if !first {
            query_builder.push(", ");
        }
        query_builder.push("text = ");
        query_builder.push_bind(text);
        first = false;
    }
    
    if let Some(completed) = update.completed {
        if !first {
            query_builder.push(", ");
        }
        query_builder.push("completed = ");
        query_builder.push_bind(if completed { 1i64 } else { 0i64 }); // Convert bool to INTEGER
        first = false;
    }
    
    if let Some(time) = update.time {
        if !first {
            query_builder.push(", ");
        }
        query_builder.push("time = ");
        query_builder.push_bind(time);
        first = false;
    }

    if first {
        return Err("No fields to update".to_string());
    }

    query_builder.push(" WHERE id = ");
    query_builder.push_bind(id);
    query_builder.push(" RETURNING id, text, completed, time, created_at, project_id");

    let query = query_builder.build();
    let result = query
        .fetch_one(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to update todo: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    let completed_int: i64 = result.get("completed");
    let updated_todo = Todo {
        id: result.get("id"),
        text: result.get("text"),
        completed: completed_int != 0, // Convert INTEGER to bool
        time: result.get("time"),
        created_at: result.get("created_at"),
        project_id: result.get("project_id"),
    };

    Ok(updated_todo)
}

pub async fn delete_todo_by_id(id: i64, pool: &SqlitePool) -> Result<(), String> {
    sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to delete todo: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    Ok(())
} 