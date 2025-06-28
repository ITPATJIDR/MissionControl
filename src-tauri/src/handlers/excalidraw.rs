use tauri::State;
use crate::database::{Database, get_pool};
use crate::types::ExcalidrawData;
use crate::services::excalidraw;

#[tauri::command]
pub async fn save_excalidraw_data(
    elements: String,
    app_state: String,
    project_id: i64,
    database: State<'_, Database>,
) -> Result<(), String> {
    let pool = get_pool(&database).await?;
    excalidraw::save_excalidraw_data(elements, app_state, project_id, &pool).await
}

#[tauri::command]
pub async fn get_excalidraw_data(project_id: i64, database: State<'_, Database>) -> Result<Option<ExcalidrawData>, String> {
    let pool = get_pool(&database).await?;
    excalidraw::get_excalidraw_data(project_id, &pool).await
} 