use std::path::Path;
use std::sync::{Arc, Mutex, MutexGuard};

use anyhow::{Context, Result};
use rusqlite::Connection;

pub struct Database {
    connection: Mutex<Connection>,
}

impl Database {
    pub fn open(path: Option<&Path>) -> Result<Arc<Self>> {
        let connection = match path {
            Some(path) => Connection::open(path)
                .with_context(|| format!("failed to open {}", path.display()))?,
            None => Connection::open_in_memory()?,
        };
        connection
            .execute_batch(
                "PRAGMA journal_mode = WAL;
                 PRAGMA synchronous = NORMAL;
                 CREATE TABLE IF NOT EXISTS streamers (
                     position INTEGER PRIMARY KEY,
                     channels TEXT NOT NULL
                 );",
            )
            .context("failed to create the database tables")?;
        Ok(Arc::new(Self {
            connection: Mutex::new(connection),
        }))
    }

    #[cfg(test)]
    pub fn memory() -> Arc<Self> {
        Self::open(None).unwrap()
    }

    pub fn lock(&self) -> MutexGuard<'_, Connection> {
        self.connection.lock().unwrap()
    }
}

#[cfg(test)]
pub fn temporary_path(name: &str) -> std::path::PathBuf {
    let path = std::env::temp_dir().join(format!(
        "moblin-website-{name}-{}.sqlite",
        std::process::id()
    ));
    remove(&path);
    path
}

#[cfg(test)]
pub fn remove(path: &Path) {
    for suffix in ["", "-wal", "-shm"] {
        let _ = std::fs::remove_file(format!("{}{suffix}", path.display()));
    }
}
