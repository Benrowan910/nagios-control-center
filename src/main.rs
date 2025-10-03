include!("rs-backend/auth.rs");
use axum::{
    routing::{post, get},
    Json, Router,
};
use std::net::SocketAddr;
use tokio::net::TcpListener;

#[derive(Deserialize)]
struct Credentials {
    username: String,
    password: String,
}

#[tokio::main]
async fn main() {
    let app = Router::new()
        .route("/api/setup-admin", post(setup_admin))
        .route("/api/login", post(login))
        .route("/api/needs-setup", get(needs_setup));

    let listener = TcpListener::bind("127.0.0.1:3089").await.unwrap();
    println!("Server running on http://{}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

async fn needs_setup() -> Json<bool> {
    let users = USERS.lock().unwrap();
    Json(users.is_empty())
}

async fn setup_admin(Json(creds): Json<Credentials>) -> &'static str {
    let mut users = USERS.lock().unwrap();
    if !users.is_empty() {
        return "Admin already exists";
    }
    let admin = create_user(&creds.username, &creds.password, "admin");
    users.push(admin);
    save_users(&users);
    "Admin created"
}

async fn login(Json(creds): Json<Credentials>) -> Json<bool> {
    let success = validate_login(&creds.username, &creds.password);
    Json(success)
}
