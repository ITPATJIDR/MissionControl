use sqlx::{sqlite::SqlitePool, Row};
use crate::types::ExcalidrawData;

pub async fn save_excalidraw_data(
    elements: String,
    app_state: String,
    project_id: i64,
    pool: &SqlitePool,
) -> Result<(), String> {
    println!("Saving Excalidraw data for project: {}", project_id);

    // Delete existing data for this project
    sqlx::query("DELETE FROM excalidraw_data WHERE project_id = ?")
        .bind(project_id)
        .execute(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to clear excalidraw data: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    // Insert new data (even if empty - this ensures project isolation)
    sqlx::query(
        "INSERT INTO excalidraw_data (elements, app_state, project_id) VALUES (?, ?, ?)"
    )
    .bind(&elements)
    .bind(&app_state)
    .bind(project_id)
    .execute(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to save excalidraw data: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    println!("Excalidraw data saved successfully for project {}", project_id);
    Ok(())
}

pub async fn get_excalidraw_data(project_id: i64, pool: &SqlitePool) -> Result<Option<ExcalidrawData>, String> {
    let row = sqlx::query("SELECT id, elements, app_state, updated_at, project_id FROM excalidraw_data WHERE project_id = ? ORDER BY updated_at DESC LIMIT 1")
        .bind(project_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to fetch excalidraw data: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    match row {
        Some(row) => {
            let data = ExcalidrawData {
                id: row.get("id"),
                elements: row.get("elements"),
                app_state: row.get("app_state"),
                updated_at: row.get("updated_at"),
                project_id: row.get("project_id"),
            };
            Ok(Some(data))
        }
        None => {
            println!("No Excalidraw data found for project {}", project_id);
            Ok(None)
        }
    }
} 