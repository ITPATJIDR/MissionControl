# Rust Backend Organization

This Tauri backend has been reorganized into a clean, modular structure for better maintainability and code clarity.

## 📁 Project Structure

```
src-tauri/src/
├── types.rs              # All data structures and models
├── database.rs           # Database connection and initialization
├── services/             # Business logic layer
│   ├── mod.rs           # Services module index
│   ├── projects.rs      # Project business logic
│   ├── todos.rs         # Todo business logic
│   └── excalidraw.rs    # Excalidraw business logic
├── handlers/             # Tauri command handlers (API layer)
│   ├── mod.rs           # Handlers module index
│   ├── database.rs      # Database initialization commands
│   ├── projects.rs      # Project API handlers
│   ├── todos.rs         # Todo API handlers
│   └── excalidraw.rs    # Excalidraw API handlers
└── main.rs              # Application entry point (simplified)
```

## 🎯 Architecture Layers

### 1. **Types Layer** (`types.rs`)
- All data structures and models
- Serde serialization/deserialization
- Shared across all modules

### 2. **Database Layer** (`database.rs`)
- Database connection management
- Database initialization and table creation
- Connection pooling and error handling

### 3. **Services Layer** (`services/`)
- **Business logic** - Core application functionality
- **Database operations** - SQL queries and data manipulation
- **No Tauri dependencies** - Pure business logic

### 4. **Handlers Layer** (`handlers/`)
- **Tauri command handlers** - API endpoints
- **Input validation** and error handling
- **Delegates to services** - Thin wrapper over business logic

### 5. **Main** (`main.rs`)
- Application entry point
- Dependency injection setup
- Handler registration

## 🚀 Key Benefits

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Business logic is isolated from Tauri framework
3. **Maintainability**: Clear structure makes code easier to modify
4. **Reusability**: Services can be reused across different handlers
5. **Scalability**: Easy to add new features following the same pattern

## 📖 Usage Examples

### Adding a New Feature

1. **Define types** in `types.rs`:
```rust
#[derive(Debug, Serialize, Deserialize)]
pub struct NewFeature {
    pub id: i64,
    pub name: String,
}
```

2. **Add service logic** in `services/new_feature.rs`:
```rust
pub async fn create_feature(pool: &SqlitePool) -> Result<NewFeature, String> {
    // Business logic here
}
```

3. **Add handler** in `handlers/new_feature.rs`:
```rust
#[tauri::command]
pub async fn create_feature_handler(database: State<'_, Database>) -> Result<NewFeature, String> {
    let pool = get_pool(&database).await?;
    new_feature_service::create_feature(&pool).await
}
```

4. **Register in main.rs**:
```rust
use handlers::new_feature::create_feature_handler;

.invoke_handler(tauri::generate_handler![
    create_feature_handler,
    // ... other handlers
])
```

## 🔧 Data Flow

```
Frontend Request
    ↓
Tauri Handler (handlers/)
    ↓
Service Logic (services/)
    ↓
Database Layer (database.rs)
    ↓
SQLite Database
```

## 📝 Code Organization Principles

- **Handlers**: Thin wrappers that handle Tauri-specific concerns
- **Services**: Pure business logic with no framework dependencies
- **Database**: Centralized connection and initialization logic
- **Types**: Shared data structures across all layers
- **Main**: Minimal setup and configuration

This structure makes the codebase much more maintainable and follows Rust best practices for modular design. 