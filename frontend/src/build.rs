use std::process::Command;

fn main() {
    println!("cargo:rerun-if-changed=../frontend"); // Adjust path to your frontend

    // Build the frontend
    let frontend_build = Command::new("npm")
        .args(&["run", "build"])
        .current_dir("../frontend") // Adjust path to your frontend directory
        .status()
        .expect("Failed to build frontend");

    if !frontend_build.success() {
        panic!("Frontend build failed");
    }

    println!("cargo:warning=Frontend built successfully");
}
