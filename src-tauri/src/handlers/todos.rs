use tauri::State;
use crate::database::{Database, get_pool};
use crate::types::{Todo, UpdateTodo};
use crate::services::todos;

#[tauri::command]
pub async fn get_todos(project_id: i64, database: State<'_, Database>) -> Result<Vec<Todo>, String> {
    let pool = get_pool(&database).await?;
    todos::get_todos_by_project(project_id, &pool).await
}

#[tauri::command]
pub async fn create_todo(
    text: String,
    time: i32,
    project_id: i64,
    database: State<'_, Database>
) -> Result<Todo, String> {
    let pool = get_pool(&database).await?;
    todos::create_new_todo(text, time, project_id, &pool).await
}

#[tauri::command]
pub async fn update_todo(id: i64, update: UpdateTodo, database: State<'_, Database>) -> Result<Todo, String> {
    let pool = get_pool(&database).await?;
    todos::update_todo_by_id(id, update, &pool).await
}

#[tauri::command]
pub async fn delete_todo(id: i64, database: State<'_, Database>) -> Result<(), String> {
    let pool = get_pool(&database).await?;
    todos::delete_todo_by_id(id, &pool).await
} 