# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: cargo-chef base — toolchain + dependency-caching utility
# ---------------------------------------------------------------------------
FROM docker.io/lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

# ---------------------------------------------------------------------------
# Stage 2: planner — computes the dependency recipe (metadata only).
# Dependency layer is cached unless Cargo.toml/Cargo.lock change,
# so code-only edits rebuild in seconds, not minutes.
# ---------------------------------------------------------------------------
FROM chef AS planner
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo chef prepare --recipe-path recipe.json

# ---------------------------------------------------------------------------
# Stage 3: builder — cook deps (cached), then build the binary.
# Target: x86_64-unknown-linux-musl -> fully static binary (no libc needed),
# which is what allows gcr.io/distroless/static as the runtime.
# TLS is rustls+ring with webpki-roots compiled in, so no /etc/ssl/certs
# and no OpenSSL are required in the final image.
# ---------------------------------------------------------------------------
FROM chef AS builder
RUN apt-get update \
    && apt-get install -y --no-install-recommends musl-tools \
    && rm -rf /var/lib/apt/lists/* \
    && rustup target add x86_64-unknown-linux-musl
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --locked --target x86_64-unknown-linux-musl --recipe-path recipe.json
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release --locked --target x86_64-unknown-linux-musl --bin resume-api

# ---------------------------------------------------------------------------
# Stage 4: runtime — distroless static. No shell, no package manager,
# no libc: attack surface is the binary alone. Runs as nonroot.
# ---------------------------------------------------------------------------
FROM gcr.io/distroless/static-debian12:nonroot AS runtime
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/resume-api /resume-api
USER nonroot
EXPOSE 8080
ENV PORT=8080
ENTRYPOINT ["/resume-api"]
