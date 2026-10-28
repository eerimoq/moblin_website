mod api;
mod app_attest;
mod challenges;
mod cloud;
mod database;
mod kick;
mod live;
mod live_status;
mod profiles;
mod store;
mod twitch;

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result};
use axum::Router;
use clap::Parser;
use log::{info, warn};
use reqwest::Client;
use tokio::net::TcpListener;
use tokio::signal::unix::{SignalKind, signal};

use crate::api::Api;
use crate::app_attest::{AppAttest, Environment};
use crate::challenges::Challenges;
use crate::cloud::Cloud;
use crate::database::Database;
use crate::kick::Kick;
use crate::live::Live;
use crate::live_status::LiveStatus;
use crate::profiles::Profiles;
use crate::store::Store;
use crate::twitch::Twitch;

const TIMEOUT: Duration = Duration::from_secs(15);

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
    /// Maximum number of listed streamers.
    #[arg(long, env = "MAX_STREAMERS", default_value_t = 6)]
    max_streamers: usize,
    /// Minimum seconds between platform requests.
    #[arg(long, env = "LOOKUP_SPACING", default_value_t = 2)]
    lookup_spacing: u64,
    /// Twitch application client ID.
    #[arg(long, env = "TWITCH_CLIENT_ID", requires = "twitch_client_secret")]
    twitch_client_id: Option<String>,
    /// Twitch application client secret.
    #[arg(
        long,
        env = "TWITCH_CLIENT_SECRET",
        hide_env_values = true,
        requires = "twitch_client_id"
    )]
    twitch_client_secret: Option<String>,
    /// Twitch channel whose live status the website shows.
    #[arg(long, env = "TWITCH_LIVE_CHANNEL", default_value = "eerimoq")]
    twitch_live_channel: String,
    /// App ID of the Moblin app, for App Attest.
    #[arg(long, env = "APP_ID", default_value = "L82N7LD4N5.com.eerimoq.Mobs")]
    app_id: String,
    /// App Attest environment.
    #[arg(long, env = "APP_ATTEST_ENVIRONMENT", value_enum, default_value_t = Environment::Production)]
    app_attest_environment: Environment,
    /// SQLite database. In memory without it.
    #[arg(long, env = "DATABASE")]
    database: Option<PathBuf>,
    /// URL of the website.
    #[arg(long, env = "FRONTEND_URL")]
    frontend_url: String,
    /// URL of the Moblin Cloud backend, which has the streamers' tip pages. Without it the
    /// streamers are listed without them.
    #[arg(long, env = "CLOUD_URL")]
    cloud_url: Option<String>,
    /// Accept live posts without App Attest, for development.
    #[arg(long)]
    allow_unattested: bool,
}

fn http_client() -> Client {
    Client::builder()
        .user_agent(concat!(
            env!("CARGO_PKG_NAME"),
            "/",
            env!("CARGO_PKG_VERSION"),
            " (+https://moblin.app)"
        ))
        .timeout(TIMEOUT)
        .build()
        .expect("a client without a proxy or TLS config always builds")
}

#[tokio::main]
async fn main() -> Result<()> {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    let cli = Cli::parse();
    let client = http_client();
    if cli.database.is_none() {
        warn!("no database, forgetting streamers on restart");
    }
    let database = Database::open(cli.database.as_deref())?;
    let store = Arc::new(Store::new(cli.max_streamers, database));
    let twitch = match (cli.twitch_client_id, cli.twitch_client_secret) {
        (Some(client_id), Some(client_secret)) => Some(Arc::new(Twitch::new(
            client.clone(),
            client_id,
            client_secret,
        ))),
        _ => {
            warn!(
                "no Twitch client ID and secret, not looking Twitch profiles up nor checking who is live"
            );
            None
        }
    };
    let kick = Arc::new(Kick::new(client.clone()));
    let profiles = Profiles::new(
        client.clone(),
        twitch.clone(),
        kick.clone(),
        Duration::from_secs(cli.lookup_spacing),
        store.clone(),
    );
    tokio::spawn(async move { profiles.run().await });
    let live_status = LiveStatus::new(
        twitch.clone(),
        kick,
        Duration::from_secs(cli.lookup_spacing),
        store.clone(),
    );
    tokio::spawn(async move { live_status.run().await });
    let cloud = match cli.cloud_url {
        Some(url) => {
            info!("linking the streamers' tip pages at {url}");
            let cloud = Arc::new(Cloud::new(client, url, store.clone()));
            tokio::spawn({
                let cloud = cloud.clone();
                async move { cloud.run().await }
            });
            Some(cloud)
        }
        None => {
            warn!("no Moblin Cloud URL, listing the streamers without their tip pages");
            None
        }
    };
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
        cloud,
        challenges: Challenges::new(),
        app_attest,
        live: twitch.map(|twitch| Live::new(twitch, cli.twitch_live_channel)),
        frontend_url: cli.frontend_url,
    });
    let listener = TcpListener::bind(cli.listen)
        .await
        .with_context(|| format!("failed to listen on {}", cli.listen))?;
    info!("listening on http://{}", cli.listen);
    serve(listener, api::router(api), shutdown_signal()).await?;
    info!("stopped");
    Ok(())
}

async fn serve(
    listener: TcpListener,
    router: Router,
    shutdown: impl Future<Output = ()> + Send + 'static,
) -> Result<()> {
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown)
        .await?;
    Ok(())
}

async fn shutdown_signal() {
    let mut terminate = match signal(SignalKind::terminate()) {
        Ok(terminate) => terminate,
        Err(error) => {
            warn!("not listening for SIGTERM: {error}");
            std::future::pending().await
        }
    };
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
        _ = terminate.recv() => {}
    }
    info!("shutting down, finishing the requests in flight");
}

#[cfg(test)]
mod tests {
    use axum::routing::get;
    use reqwest::StatusCode;
    use tokio::sync::oneshot;

    use super::*;

    #[tokio::test]
    async fn requests_in_flight_finish_before_stopping() {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let router = Router::new().route(
            "/slow",
            get(|| async {
                tokio::time::sleep(Duration::from_millis(300)).await;
                "done"
            }),
        );
        let (stop, stopped) = oneshot::channel();
        let server = tokio::spawn(serve(listener, router, async {
            stopped.await.unwrap();
        }));
        let request = tokio::spawn(async move {
            reqwest::Client::new()
                .get(format!("http://{address}/slow"))
                .send()
                .await
                .unwrap()
        });
        tokio::time::sleep(Duration::from_millis(50)).await;
        stop.send(()).unwrap();
        let response = request.await.unwrap();
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(response.text().await.unwrap(), "done");
        tokio::time::timeout(Duration::from_secs(5), server)
            .await
            .unwrap()
            .unwrap()
            .unwrap();
        assert!(
            reqwest::Client::new()
                .get(format!("http://{address}/slow"))
                .send()
                .await
                .is_err()
        );
    }
}
