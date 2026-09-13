mod api;
mod profiles;
mod store;

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use clap::Parser;
use log::info;

use crate::profiles::Profiles;
use crate::store::Store;

#[derive(Parser)]
#[command(
    name = "moblin-website-backend",
    version,
    about = "Serves the list of streamers who recently went live with Moblin"
)]
struct Cli {
    /// Address to listen on.
    #[arg(long, env = "LISTEN", default_value = "127.0.0.1:8080")]
    listen: SocketAddr,
    /// Never list more than this many streamers, most recently live first.
    #[arg(long, env = "MAX_STREAMERS", default_value_t = 8)]
    max_streamers: usize,
    /// Pause at least this many seconds between two requests to the
    /// platforms, when looking profiles up.
    #[arg(long, env = "LOOKUP_SPACING", default_value_t = 2)]
    lookup_spacing: u64,
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    let cli = Cli::parse();
    let store = Arc::new(Store::new(cli.max_streamers));
    let profiles = Profiles::new(Duration::from_secs(cli.lookup_spacing), store.clone());
    tokio::spawn(async move { profiles.run().await });
    let listener = tokio::net::TcpListener::bind(cli.listen)
        .await
        .with_context(|| format!("failed to listen on {}", cli.listen))?;
    info!("listening on http://{}", cli.listen);
    axum::serve(listener, api::router(store)).await?;
    Ok(())
}
