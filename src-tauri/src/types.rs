use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Todo {
    pub id: i64,
    pub text: String,
    pub completed: bool,
    pub time: i32, // time in minutes
    pub created_at: String,
    pub project_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTodo {
    pub text: String,
    pub time: i32,
    #[serde(rename = "projectId")]
    pub project_id: i64,
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
    pub project_id: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveExcalidrawData {
    pub elements: String,
    pub app_state: String,
    #[serde(rename = "projectId")]
    pub project_id: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateProject {
    pub name: String,
    pub description: Option<String>,
} 