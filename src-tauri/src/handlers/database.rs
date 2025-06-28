use tauri::State;
use crate::database::{Database, init_database as database_init};

#[tauri::command]
pub async fn init_database(database: State<'_, Database>) -> Result<String, String> {
    database_init(&database).await
} 