// src/auth.rs
use bcrypt::{DEFAULT_COST, hash, verify};
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::fs; // Use std::fs instead of tokio::fs
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
    println!("📊 Loaded {} users from storage", users.len());
    Mutex::new(users)
});

pub static SESSIONS: Lazy<Mutex<Vec<Session>>> = Lazy::new(|| {
    let sessions = load_sessions();
    println!("📊 Loaded {} sessions from storage", sessions.len());
    Mutex::new(sessions)
});

pub fn load_users() -> Vec<User> {
    match fs::read_to_string(USER_FILE) {
        // This is std::fs::read_to_string (synchronous)
        Ok(data) => match serde_json::from_str(&data) {
            Ok(users) => users,
            Err(e) => {
                eprintln!("❌ Error parsing users file: {}", e);
                vec![]
            }
        },
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                println!("📝 No users file found, starting with empty user database");
            } else {
                eprintln!("❌ Error reading users file: {}", e);
            }
            vec![]
        }
    }
}

pub fn load_sessions() -> Vec<Session> {
    match fs::read_to_string(SESSION_FILE) {
        // This is std::fs::read_to_string (synchronous)
        Ok(data) => match serde_json::from_str(&data) {
            Ok(sessions) => sessions,
            Err(e) => {
                eprintln!("❌ Error parsing sessions file: {}", e);
                vec![]
            }
        },
        Err(e) => {
            if e.kind() == std::io::ErrorKind::NotFound {
                println!("📝 No sessions file found, starting with empty sessions");
            } else {
                eprintln!("❌ Error reading sessions file: {}", e);
            }
            vec![]
        }
    }
}

pub fn save_users(users: &Vec<User>) {
    match serde_json::to_string_pretty(users) {
        Ok(data) => {
            if let Err(e) = fs::write(USER_FILE, data) {
                // This is std::fs::write (synchronous)
                eprintln!("❌ Error saving users: {}", e);
            } else {
                println!("💾 Saved {} users to storage", users.len());
            }
        }
        Err(e) => {
            eprintln!("❌ Error serializing users: {}", e);
        }
    }
}

pub fn save_sessions(sessions: &Vec<Session>) {
    match serde_json::to_string_pretty(sessions) {
        Ok(data) => {
            if let Err(e) = fs::write(SESSION_FILE, data) {
                // This is std::fs::write (synchronous)
                eprintln!("❌ Error saving sessions: {}", e);
            } else {
                println!("💾 Saved {} sessions to storage", sessions.len());
            }
        }
        Err(e) => {
            eprintln!("❌ Error serializing sessions: {}", e);
        }
    }
}

pub fn create_user(username: &str, password: &str, role: &str) -> User {
    let hashed = match hash(password, DEFAULT_COST) {
        Ok(h) => h,
        Err(e) => {
            eprintln!("❌ Error hashing password: {}", e);
            // In a real app, you should handle this more gracefully
            panic!("Failed to hash password");
        }
    };

    User {
        username: username.to_string(),
        password_hash: hashed,
        role: role.to_string(),
    }
}

pub fn validate_login(username: &str, password: &str) -> Option<String> {
    let users = USERS.lock().unwrap();

    if let Some(user) = users.iter().find(|u| u.username == username) {
        match verify(password, &user.password_hash) {
            Ok(true) => {
                println!("✅ Login successful for user: {}", username);

                // Create session
                let session_id = Uuid::new_v4().to_string();
                let now = SystemTime::now()
                    .duration_since(UNIX_EPOCH)
                    .expect("Time went backwards")
                    .as_secs();
                let expires_at = now + (24 * 60 * 60); // 24 hours

                let session = Session {
                    session_id: session_id.clone(),
                    username: username.to_string(),
                    created_at: now,
                    expires_at,
                };

                // Add session to storage
                let mut sessions = SESSIONS.lock().unwrap();
                sessions.push(session);
                save_sessions(&sessions);

                Some(session_id)
            }
            Ok(false) => {
                println!("❌ Invalid password for user: {}", username);
                None
            }
            Err(e) => {
                eprintln!("❌ Error verifying password for user {}: {}", username, e);
                None
            }
        }
    } else {
        println!("❌ User not found: {}", username);
        None
    }
}

pub fn validate_session(session_id: &str) -> bool {
    let sessions = SESSIONS.lock().unwrap();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    sessions
        .iter()
        .any(|s| s.session_id == session_id && s.expires_at > now)
}

pub fn cleanup_sessions() {
    let mut sessions = SESSIONS.lock().unwrap();
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards")
        .as_secs();

    let initial_count = sessions.len();
    sessions.retain(|s| s.expires_at > now);
    let final_count = sessions.len();

    if initial_count != final_count {
        save_sessions(&sessions);
        println!(
            "🧹 Cleaned up {} expired sessions",
            initial_count - final_count
        );
    }
}

pub fn logout_session(session_id: &str) {
    let mut sessions = SESSIONS.lock().unwrap();
    let initial_count = sessions.len();
    sessions.retain(|s| s.session_id != session_id);
    let final_count = sessions.len();

    if initial_count != final_count {
        save_sessions(&sessions);
        println!("🚪 Logged out session: {}", session_id);
    }
}

pub fn logout_all_sessions() {
    let mut sessions = SESSIONS.lock().unwrap();
    let session_count = sessions.len();
    sessions.clear();
    save_sessions(&sessions);
    println!("🚪 Logged out all {} sessions", session_count);
}

pub fn admin_exists() -> bool {
    let users = USERS.lock().unwrap();
    users.iter().any(|user| user.role == "admin")
}
