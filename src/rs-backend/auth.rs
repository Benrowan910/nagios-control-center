// src/auth.rs
use serde::{Deserialize, Serialize};
use std::fs;
use bcrypt::{hash, verify};
use once_cell::sync::Lazy;
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub username: String,
    pub password_hash: String,
    pub role: String,
}

const USER_FILE: &str = "users.json";

pub static USERS: Lazy<Mutex<Vec<User>>> = Lazy::new(|| {
    let users = load_users();
    Mutex::new(users)
});

pub fn load_users() -> Vec<User> {
    if let Ok(data) = fs::read_to_string(USER_FILE) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        vec![]
    }
}

pub fn save_users(users: &Vec<User>) {
    let data = serde_json::to_string_pretty(users).unwrap();
    fs::write(USER_FILE, data).unwrap();
}

pub fn create_user(username: &str, password: &str, role: &str) -> User {
    let hashed = hash(password, 12).unwrap();
    User {
        username: username.to_string(),
        password_hash: hashed,
        role: role.to_string(),
    }
}

pub fn validate_login(username: &str, password: &str) -> bool {
    let users = USERS.lock().unwrap();
    if let Some(user) = users.iter().find(|u| u.username == username) {
        verify(password, &user.password_hash).unwrap_or(false)
    } else {
        false
    }
}
