include!("auth.rs");
use axum::{
    Json, Router,
    http::{Method, StatusCode, Uri},
    response::Response,
    routing::{get, post},
};
use include_dir::{Dir, include_dir};
use mime_guess::from_path;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};

// Include the built frontend directory
static FRONTEND_DIR: Dir = include_dir!("dist");

#[derive(Deserialize)]
struct Credentials {
    username: String,
    password: String,
}

#[derive(Deserialize)]
struct SessionRequest {
    session_id: String,
}

#[derive(Serialize)]
struct AuthResponse {
    success: bool,
    session_id: Option<String>,
    message: Option<String>,
}

#[tokio::main]
async fn main() {
    println!("🚀 Starting server...");

    // Check if we have frontend files
    if FRONTEND_DIR.get_file("index.html").is_none() {
        eprintln!("❌ WARNING: No index.html found in embedded frontend files");
        eprintln!(
            "💡 Make sure to build the frontend with 'npm run build' in the frontend directory"
        );
    }

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/setup-admin", post(setup_admin))
        .route("/api/login", post(login))
        .route("/api/logout", post(logout))
        .route("/api/validate-session", post(validate_session_endpoint))
        .route("/api/needs-setup", get(needs_setup))
        .fallback(serve_static_files)
        .layer(cors);

    let listener = TcpListener::bind("0.0.0.0:3089").await.unwrap();
    println!(
        "✅ Server running on http://{}",
        listener.local_addr().unwrap()
    );

    let graceful = axum::serve(listener, app).with_graceful_shutdown(async {
        tokio::signal::ctrl_c().await.unwrap();
        println!("\nShutting down server...");
        logout_all_sessions();
        println!("All sessions cleared.");
    });

    graceful.await.unwrap();
}

async fn serve_static_files(uri: Uri) -> Result<Response, StatusCode> {
    let path = uri.path().trim_start_matches('/');
    println!("🔍 Requested path: '{}'", path);

    if path.starts_with("api/") {
        println!("❌ API route, returning 404");
        return Err(StatusCode::NOT_FOUND);
    }

    // Use the embedded files from FRONTEND_DIR
    let file_path = if path.is_empty() { "index.html" } else { path };

    println!("📁 Looking for embedded file: '{}'", file_path);

    // Check if file exists in embedded directory
    if let Some(file) = FRONTEND_DIR.get_file(file_path) {
        println!(
            "✅ Found embedded file: '{}' ({} bytes)",
            file_path,
            file.contents().len()
        );
        let mime_type = from_path(file_path).first_or_octet_stream();
        return Ok(Response::builder()
            .header("content-type", mime_type.as_ref())
            .body(axum::body::Body::from(file.contents()))
            .unwrap());
    }

    println!("❌ Embedded file not found: '{}'", file_path);

    // Fallback to index.html for SPA routes
    if let Some(index_file) = FRONTEND_DIR.get_file("index.html") {
        println!("🔄 Falling back to index.html for SPA route");
        return Ok(Response::builder()
            .header("content-type", "text/html")
            .body(axum::body::Body::from(index_file.contents()))
            .unwrap());
    }

    println!("❌ Index.html also not found in embedded files");
    Err(StatusCode::NOT_FOUND)
}

async fn needs_setup() -> Json<bool> {
    let users = USERS.lock().unwrap();
    Json(users.is_empty())
}

async fn setup_admin(Json(creds): Json<Credentials>) -> Json<AuthResponse> {
    let mut users = USERS.lock().unwrap();
    if !users.is_empty() {
        return Json(AuthResponse {
            success: false,
            session_id: None,
            message: Some("Admin already exists".to_string()),
        });
    }
    let admin = create_user(&creds.username, &creds.password, "admin");
    users.push(admin);
    save_users(&users);

    Json(AuthResponse {
        success: true,
        session_id: None,
        message: Some("Admin created".to_string()),
    })
}

async fn login(Json(creds): Json<Credentials>) -> Json<AuthResponse> {
    if let Some(session_id) = validate_login(&creds.username, &creds.password) {
        Json(AuthResponse {
            success: true,
            session_id: Some(session_id),
            message: None,
        })
    } else {
        Json(AuthResponse {
            success: false,
            session_id: None,
            message: Some("Invalid credentials".to_string()),
        })
    }
}

async fn logout(Json(req): Json<SessionRequest>) -> Json<AuthResponse> {
    logout_session(&req.session_id);
    Json(AuthResponse {
        success: true,
        session_id: None,
        message: Some("Logged out".to_string()),
    })
}

async fn validate_session_endpoint(Json(req): Json<SessionRequest>) -> Json<AuthResponse> {
    let valid = validate_session(&req.session_id);
    Json(AuthResponse {
        success: valid,
        session_id: if valid { Some(req.session_id) } else { None },
        message: None,
    })
}
