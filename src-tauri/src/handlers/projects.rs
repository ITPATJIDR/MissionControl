use tauri::State;
use crate::database::{Database, get_pool};
use crate::types::{Project, CreateProject};
use crate::services::projects;

#[tauri::command]
pub async fn get_projects(database: State<'_, Database>) -> Result<Vec<Project>, String> {
    let pool = get_pool(&database).await?;
    projects::get_all_projects(&pool).await
}

#[tauri::command]
pub async fn create_project(project: CreateProject, database: State<'_, Database>) -> Result<Project, String> {
    let pool = get_pool(&database).await?;
    projects::create_new_project(project, &pool).await
}

#[tauri::command]
pub async fn delete_project(id: i64, database: State<'_, Database>) -> Result<(), String> {
    let pool = get_pool(&database).await?;
    projects::delete_project_by_id(id, &pool).await
} 