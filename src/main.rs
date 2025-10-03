include!("rs-backend/auth.rs");

use axum::{
    Router,
    extract::Json,
    routing::{get, post},
};
use std::net::SocketAddr;

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

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running on http://{}", addr);
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

use axum::http::StatusCode;
use axum::response::IntoResponse;

async fn needs_setup() -> impl IntoResponse {
    let users = USERS.lock().unwrap();
    Json(users.is_empty())
}

async fn setup_admin(Json(creds): Json<Credentials>) -> impl IntoResponse {
    let mut users = USERS.lock().unwrap();
    if !users.is_empty() {
        return (StatusCode::BAD_REQUEST, "Admin already exists");
    }
    let admin = create_user(&creds.username, &creds.password, "admin");
    users.push(admin);
    save_users(&users);
    (StatusCode::OK, "Admin created")
}

async fn login(Json(creds): Json<Credentials>) -> impl IntoResponse {
    let success = validate_login(&creds.username, &creds.password);
    if success {
        (StatusCode::OK, Json(true))
    } else {
        (StatusCode::UNAUTHORIZED, Json(false))
    }
}
