// src/auth.rs
use bcrypt::{hash, verify};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

#[derive(Serialize, Deserialize, Clone)]
pub struct User {
    pub username: String,
    pub password_hash: String,
    pub role: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct Session {
    pub session_id: String,
    pub username: String,
    pub created_at: u64,
    pub expires_at: u64,
}

const USER_FILE: &str = "users.json";
const SESSION_FILE: &str = "sessions.json";

pub static USERS: Lazy<Mutex<Vec<User>>> = Lazy::new(|| {
    let users = load_users();
    Mutex::new(users)
});

pub static SESSIONS: Lazy<Mutex<Vec<Session>>> = Lazy::new(|| {
    let sessions = load_sessions();
    Mutex::new(sessions)
});

pub fn load_users() -> Vec<User> {
    if let Ok(data) = fs::read_to_string(USER_FILE) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        vec![]
    }
}

pub fn load_sessions() -> Vec<Session> {
    if let Ok(data) = fs::read_to_string(SESSION_FILE) {
        serde_json::from_str(&data).unwrap_or_default()
    } else {
        vec![]
    }
}

pub fn save_users(users: &Vec<User>) {
    let data = serde_json::to_string_pretty(users).unwrap();
    fs::write(USER_FILE, data).unwrap();
}

pub fn save_sessions(sessions: &Vec<Session>) {
    let data = serde_json::to_string_pretty(sessions).unwrap();
    fs::write(SESSION_FILE, data).unwrap();
}

pub fn create_user(username: &str, password: &str, role: &str) -> User {
    let hashed = hash(password, 12).unwrap();
    User {
        username: username.to_string(),
        password_hash: hashed,
        role: role.to_string(),
    }
}

pub fn validate_login(username: &str, password: &str) -> Option<String> {
    let users = USERS.lock().unwrap();
    if let Some(user) = users.iter().find(|u| u.username == username) {
        if verify(password, &user.password_hash).unwrap_or(false) {
            // Create session
            let session_id = Uuid::new_v4().to_string();
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            let expires_at = now + (24 * 60 * 60); // 24 hours

            let session = Session {
                session_id: session_id.clone(),
                username: username.to_string(),
                created_at: now,
                expires_at,
            };

            let mut sessions = SESSIONS.lock().unwrap();
            sessions.push(session);
            save_sessions(&sessions);

            return Some(session_id);
        }
    }
    None
}

pub fn validate_session(session_id: &str) -> bool {
    let sessions = SESSIONS.lock().unwrap();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    sessions
        .iter()
        .any(|s| s.session_id == session_id && s.expires_at > now)
}

pub fn cleanup_sessions() {
    let mut sessions = SESSIONS.lock().unwrap();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs();

    sessions.retain(|s| s.expires_at > now);
    save_sessions(&sessions);
}

pub fn logout_session(session_id: &str) {
    let mut sessions = SESSIONS.lock().unwrap();
    sessions.retain(|s| s.session_id != session_id);
    save_sessions(&sessions);
}

pub fn logout_all_sessions() {
    let mut sessions = SESSIONS.lock().unwrap();
    sessions.clear();
    save_sessions(&sessions);
}
