# Build stage
FROM rust:1.98-slim-bookworm AS builder

WORKDIR /app

# Cache dependencies separately from the source.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs \
    && cargo build --release --locked \
    && rm -rf src target/release/moblin-website-backend* target/release/deps/moblin_website_backend*

COPY src ./src
RUN cargo build --release --locked

# Runtime stage
FROM debian:bookworm-slim

RUN useradd --system --no-create-home --uid 1000 app

COPY --from=builder /app/target/release/moblin-website-backend /usr/local/bin/moblin-website-backend

USER app

# Listen on all interfaces so the port can be published from the container.
ENV LISTEN=0.0.0.0:8080
EXPOSE 8080

ENTRYPOINT ["moblin-website-backend"]
