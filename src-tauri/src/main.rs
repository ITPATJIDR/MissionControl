// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod types;
mod database;
mod services;
mod handlers;

use database::Database;
use handlers::{
    database::init_database,
    projects::{get_projects, create_project, delete_project},
    todos::{get_todos, create_todo, update_todo, delete_todo},
    excalidraw::{save_excalidraw_data, get_excalidraw_data},
};

fn main() {
    tauri::Builder::default()
        .manage(Database::new())
        .invoke_handler(tauri::generate_handler![
            init_database,
            get_projects,
            create_project,
            delete_project,
            get_todos,
            create_todo,
            update_todo,
            delete_todo,
            save_excalidraw_data,
            get_excalidraw_data
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
