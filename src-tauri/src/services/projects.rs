use sqlx::{sqlite::SqlitePool, Row};
use crate::types::{Project, CreateProject};

pub async fn get_all_projects(pool: &SqlitePool) -> Result<Vec<Project>, String> {
    let rows = sqlx::query("SELECT id, name, description, created_at FROM projects ORDER BY created_at ASC")
        .fetch_all(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to fetch projects: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    let projects: Vec<Project> = rows
        .into_iter()
        .map(|row| Project {
            id: row.get("id"),
            name: row.get("name"),
            description: row.get("description"),
            created_at: row.get("created_at"),
        })
        .collect();
    Ok(projects)
}

pub async fn create_new_project(project: CreateProject, pool: &SqlitePool) -> Result<Project, String> {
    let result = sqlx::query(
        "INSERT INTO projects (name, description) VALUES (?, ?) RETURNING id, name, description, created_at"
    )
    .bind(&project.name)
    .bind(&project.description)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to create project: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    let new_project = Project {
        id: result.get("id"),
        name: result.get("name"),
        description: result.get("description"),
        created_at: result.get("created_at"),
    };

    Ok(new_project)
}

pub async fn delete_project_by_id(id: i64, pool: &SqlitePool) -> Result<(), String> {
    // Don't allow deleting the last project
    let project_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM projects")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    if project_count <= 1 {
        return Err("Cannot delete the last project".to_string());
    }

    // Delete all todos in this project
    sqlx::query("DELETE FROM todos WHERE project_id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to delete todos for project: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    // Delete excalidraw data for this project
    sqlx::query("DELETE FROM excalidraw_data WHERE project_id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to delete excalidraw data for project: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    // Delete the project
    sqlx::query("DELETE FROM projects WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to delete project: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    Ok(())
} 