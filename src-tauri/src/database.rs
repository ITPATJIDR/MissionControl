use sqlx::{sqlite::SqlitePool, Row};
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::State;
use std::path::PathBuf;

// Database state - using Arc<Mutex> for thread safety
pub struct Database {
    pub pool: Arc<Mutex<Option<SqlitePool>>>,
    pub initialized: Arc<Mutex<bool>>,
}

impl Database {
    pub fn new() -> Self {
        Self {
            pool: Arc::new(Mutex::new(None)),
            initialized: Arc::new(Mutex::new(false)),
        }
    }
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

async fn create_tables(pool: &SqlitePool) -> Result<(), String> {
    // Create projects table first (referenced by other tables)
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to create projects table: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    // Create todos table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            time INTEGER NOT NULL DEFAULT 25,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            project_id INTEGER REFERENCES projects(id) DEFAULT 1
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to create todos table: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    // Create excalidraw_data table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS excalidraw_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            elements TEXT NOT NULL,
            app_state TEXT NOT NULL,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            project_id INTEGER REFERENCES projects(id) DEFAULT 1
        )
        "#,
    )
    .execute(pool)
    .await
    .map_err(|e| {
        let error_msg = format!("Failed to create excalidraw_data table: {}", e);
        println!("{}", error_msg);
        error_msg
    })?;

    Ok(())
}

async fn create_default_project(pool: &SqlitePool) -> Result<(), String> {
    // Create default project if none exists
    let project_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM projects")
        .fetch_one(pool)
        .await
        .unwrap_or(0);

    if project_count == 0 {
        sqlx::query("INSERT INTO projects (name, description) VALUES (?, ?)")
            .bind("Default Project")
            .bind("Your first project")
            .execute(pool)
            .await
            .map_err(|e| {
                let error_msg = format!("Failed to create default project: {}", e);
                println!("{}", error_msg);
                error_msg
            })?;
        println!("Default project created");
    }

    Ok(())
}

// Initialize database
pub async fn init_database(database: &Database) -> Result<String, String> {
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

                // Create tables
                create_tables(&pool).await?;
                
                if is_new_database {
                    println!("New database tables created successfully");
                } else {
                    println!("Database tables verified/exist");
                }

                // Create default project if needed
                create_default_project(&pool).await?;

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
pub async fn get_pool(database: &State<'_, Database>) -> Result<SqlitePool, String> {
    let pool_guard = database.pool.lock().await;
    match pool_guard.as_ref() {
        Some(pool) => Ok(pool.clone()),
        None => {
            drop(pool_guard); // Release the lock
            
            // Initialize database
            let init_result = init_database(database).await;
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