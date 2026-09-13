mod api;
mod app_attest;
mod challenges;
mod profiles;
mod store;

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use clap::Parser;
use log::{info, warn};

use crate::api::Api;
use crate::app_attest::{AppAttest, Environment};
use crate::challenges::Challenges;
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
    /// The App ID (team ID, a period and the bundle ID) of the Moblin app.
    /// Only live posts signed by it, with App Attest, are accepted.
    #[arg(long, env = "APP_ID", default_value = "L82N7LD4N5.com.eerimoq.Mobs")]
    app_id: String,
    /// The App Attest environment the app runs in. Apps installed by Xcode
    /// use the development environment, distributed apps the production one.
    #[arg(long, env = "APP_ATTEST_ENVIRONMENT", value_enum, default_value_t = Environment::Production)]
    app_attest_environment: Environment,
    /// Accept live posts from anyone, not only from the Moblin app, for
    /// developing the website.
    #[arg(long)]
    allow_unattested: bool,
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    let cli = Cli::parse();
    let store = Arc::new(Store::new(cli.max_streamers));
    let profiles = Profiles::new(Duration::from_secs(cli.lookup_spacing), store.clone());
    tokio::spawn(async move { profiles.run().await });
    let app_attest = if cli.allow_unattested {
        warn!("accepting live posts from anyone");
        None
    } else {
        info!(
            "accepting live posts from {} in the {:?} App Attest environment",
            cli.app_id, cli.app_attest_environment
        );
        Some(AppAttest::new(&cli.app_id, cli.app_attest_environment))
    };
    let api = Arc::new(Api {
        store,
        challenges: Challenges::new(),
        app_attest,
    });
    let listener = tokio::net::TcpListener::bind(cli.listen)
        .await
        .with_context(|| format!("failed to listen on {}", cli.listen))?;
    info!("listening on http://{}", cli.listen);
    axum::serve(listener, api::router(api)).await?;
    Ok(())
}
