// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sqlx::{sqlite::SqlitePool, Row};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Todo {
    pub id: i64,
    pub text: String,
    pub completed: bool,
    pub time: i32, // time in minutes
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTodo {
    pub text: String,
    pub time: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTodo {
    pub text: Option<String>,
    pub completed: Option<bool>,
    pub time: Option<i32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExcalidrawData {
    pub id: i64,
    pub elements: String, // JSON string of elements
    pub app_state: String, // JSON string of app state
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveExcalidrawData {
    pub elements: String,
    pub app_state: String,
}

// Database state - using Arc<Mutex> for thread safety
pub struct Database {
    pub pool: Arc<Mutex<Option<SqlitePool>>>,
    pub initialized: Arc<Mutex<bool>>,
}

// Get database path with better error handling and fallback options
fn get_database_path() -> Result<PathBuf, String> {
    // Try multiple approaches for finding a writable directory
    let possible_paths = vec![
        // Try XDG data home first (Linux standard)
        std::env::var("XDG_DATA_HOME").ok().map(|p| PathBuf::from(p).join("missioncontrol")),
        // Try home directory with .local/share (Linux standard)
        std::env::var("HOME").ok().map(|p| PathBuf::from(p).join(".local/share/missioncontrol")),
        // Try home directory with .missioncontrol (fallback)
        std::env::var("HOME").ok().map(|p| PathBuf::from(p).join(".missioncontrol")),
        // Try Windows APPDATA
        std::env::var("APPDATA").ok().map(|p| PathBuf::from(p).join("missioncontrol")),
        // Try temp directory as last resort
        Some(std::env::temp_dir().join("missioncontrol")),
    ];

    for possible_path in possible_paths.into_iter().flatten() {
        
        // Try to create the directory
        match std::fs::create_dir_all(&possible_path) {
            Ok(_) => {
                
                // Test if we can write to this directory
                let test_file = possible_path.join("test_write.tmp");
                match std::fs::write(&test_file, "test") {
                    Ok(_) => {
                        // Clean up test file
                        let _ = std::fs::remove_file(&test_file);
                        
                        let db_path = possible_path.join("todos.db");
                        
                        // Check if database file exists
                        let db_exists = db_path.exists();
                        
                        if !db_exists {
                            println!("Database file doesn't exist - will be created on first connection");
                        }
                        
                        return Ok(db_path);
                    }
                    Err(e) => {
                        println!("Cannot write to directory {:?}: {}", possible_path, e);
                        continue;
                    }
                }
            }
            Err(e) => {
                println!("Cannot create directory {:?}: {}", possible_path, e);
                continue;
            }
        }
    }
    
    Err("Could not find a writable directory for the database".to_string())
}

// Initialize database
#[tauri::command]
async fn init_database(database: State<'_, Database>) -> Result<String, String> {
    // Check if already initialized
    {
        let initialized_guard = database.initialized.lock().await;
        if *initialized_guard {
            return Ok("Database already initialized".to_string());
        }
    }
    
    println!("Starting database initialization...");
    
    // Get the proper database path with fallback options
    let db_path = get_database_path()?;
    
    // Use absolute path and ensure proper URI format
    let absolute_path = db_path.canonicalize()
        .unwrap_or_else(|_| db_path.clone());
    
    let database_url = format!("sqlite:{}?mode=rwc", absolute_path.to_string_lossy());
    
    println!("Connecting to database: {}", database_url);
    
    // Check if this is a new database
    let is_new_database = !db_path.exists();
    if is_new_database {
        println!("Creating new database file...");
    }
    
    // Try to connect with retry logic
    let mut last_error = String::new();
    for attempt in 1..=3 {
        println!("Connection attempt {} of 3", attempt);
        
        match SqlitePool::connect(&database_url).await {
            Ok(pool) => {
                println!("Database connected successfully on attempt {}", attempt);
                
                if is_new_database {
                    println!("New database created successfully");
                }

                // Create table if it doesn't exist - using INTEGER for boolean (0/1)
                sqlx::query(
                    r#"
                    CREATE TABLE IF NOT EXISTS todos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        text TEXT NOT NULL,
                        completed INTEGER NOT NULL DEFAULT 0,
                        time INTEGER NOT NULL DEFAULT 25,
                        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    "#,
                )
                .execute(&pool)
                .await
                .map_err(|e| {
                    let error_msg = format!("Failed to create table: {}", e);
                    println!("{}", error_msg);
                    error_msg
                })?;

                if is_new_database {
                    println!("New database table 'todos' created successfully");
                } else {
                    println!("Table 'todos' verified/exists");
                }

                // Create excalidraw table if it doesn't exist
                sqlx::query(
                    r#"
                    CREATE TABLE IF NOT EXISTS excalidraw_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        elements TEXT NOT NULL,
                        app_state TEXT NOT NULL,
                        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                    )
                    "#,
                )
                .execute(&pool)
                .await
                .map_err(|e| {
                    let error_msg = format!("Failed to create excalidraw table: {}", e);
                    println!("{}", error_msg);
                    error_msg
                })?;

                if is_new_database {
                    println!("New database table 'excalidraw_data' created successfully");
                } else {
                    println!("Table 'excalidraw_data' verified/exists");
                }

                // Set the pool and mark as initialized
                {
                    let mut pool_guard = database.pool.lock().await;
                    *pool_guard = Some(pool);
                }
                
                {
                    let mut initialized_guard = database.initialized.lock().await;
                    *initialized_guard = true;
                }

                println!("Database initialization completed");
                
                let status_message = if is_new_database {
                    format!("New database created and initialized successfully at: {}", database_url)
                } else {
                    format!("Existing database initialized successfully at: {}", database_url)
                };
                
                return Ok(status_message);
            }
            Err(e) => {
                last_error = format!("Failed to connect to database (attempt {}): {}", attempt, e);
                println!("{}", last_error);
                
                if attempt < 3 {
                    println!("Retrying in 1 second...");
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                }
            }
        }
    }
    
    Err(format!("All connection attempts failed. Last error: {}", last_error))
}

// Helper function to get pool
async fn get_pool(database: &State<'_, Database>) -> Result<SqlitePool, String> {
    let pool_guard = database.pool.lock().await;
    match pool_guard.as_ref() {
        Some(pool) => Ok(pool.clone()),
        None => {
            drop(pool_guard); // Release the lock
            
            // Initialize database
            let init_result = init_database(database.clone()).await;
            println!("Auto-init result: {:?}", init_result);
            
            // Try again
            let pool_guard = database.pool.lock().await;
            pool_guard
                .as_ref()
                .ok_or("Database initialization failed".to_string())
                .map(|p| p.clone())
        }
    }
}

// Get all todos - ASCENDING order (oldest first)
#[tauri::command]
async fn get_todos(database: State<'_, Database>) -> Result<Vec<Todo>, String> {
    let pool = get_pool(&database).await?;

    // Sort by created_at ASC (oldest first), then by id ASC as secondary sort
    let rows = sqlx::query("SELECT id, text, completed, time, created_at FROM todos ORDER BY created_at ASC, id ASC")
        .fetch_all(&pool)
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
                completed: completed_int != 0, // Convert INTEGER to bool
                time: row.get("time"),
                created_at: row.get("created_at"),
            }
        })
        .collect();
    Ok(todos)
}

// Create a new todo
#[tauri::command]
async fn create_todo(todo: CreateTodo, database: State<'_, Database>) -> Result<Todo, String> {
    let pool = get_pool(&database).await?;

    let result = sqlx::query(
        "INSERT INTO todos (text, time, completed) VALUES (?, ?, 0) RETURNING id, text, completed, time, created_at"
    )
    .bind(&todo.text)
    .bind(todo.time)
    .fetch_one(&pool)
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
        completed: completed_int != 0, // Convert INTEGER to bool
        time: result.get("time"),
        created_at: result.get("created_at"),
    };

    Ok(new_todo)
}

// Update a todo
#[tauri::command]
async fn update_todo(id: i64, update: UpdateTodo, database: State<'_, Database>) -> Result<Todo, String> {
    let pool = get_pool(&database).await?;

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
    query_builder.push(" RETURNING id, text, completed, time, created_at");

    let query = query_builder.build();
    let result = query
        .fetch_one(&pool)
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
    };

    Ok(updated_todo)
}

// Delete a todo
#[tauri::command]
async fn delete_todo(id: i64, database: State<'_, Database>) -> Result<(), String> {
    let pool = get_pool(&database).await?;

    sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(&pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to delete todo: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    Ok(())
}

// Save Excalidraw data
#[tauri::command]
async fn save_excalidraw_data(
    data: SaveExcalidrawData,
    database: State<'_, Database>,
) -> Result<(), String> {
    let pool = get_pool(&database).await?;

    // Delete existing data (we only keep one drawing)
    sqlx::query("DELETE FROM excalidraw_data")
        .execute(&pool)
        .await
        .map_err(|e| {
            let error_msg = format!("Failed to clear excalidraw data: {}", e);
            println!("{}", error_msg);
            error_msg
        })?;

    // Insert new data
    sqlx::query(
        "INSERT INTO excalidraw_data (elements, app_state) VALUES (?, ?)"
    )
    .bind(&data.elements)
    .bind(&data.app_state)
    .execute(&pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to save excalidraw data: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    println!("Excalidraw data saved successfully");
    Ok(())
}

// Get Excalidraw data
#[tauri::command]
async fn get_excalidraw_data(database: State<'_, Database>) -> Result<Option<ExcalidrawData>, String> {
    let pool = get_pool(&database).await?;

    let row = sqlx::query("SELECT id, elements, app_state, updated_at FROM excalidraw_data ORDER BY updated_at DESC LIMIT 1")
        .fetch_optional(&pool)
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
            };
            Ok(Some(data))
        }
        None => Ok(None),
    }
}

fn main() {
    tauri::Builder::default()
        .manage(Database {
            pool: Arc::new(Mutex::new(None)),
            initialized: Arc::new(Mutex::new(false)),
        })
        .invoke_handler(tauri::generate_handler![
            init_database,
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
