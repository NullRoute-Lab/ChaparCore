FROM golang:1.22-alpine AS builder

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

ARG TARGETOS
ARG TARGETARCH
ARG VERSION=dev
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH:-amd64} go build -trimpath -ldflags "-s -w -X github.com/nullroute-lab/ChaparCore/internal/branding.Version=${VERSION}" -o /out/chapar-server ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot

WORKDIR /app

COPY --from=builder /out/chapar-server /app/chapar-server
COPY server_config.example.json /app/server_config.example.json

EXPOSE 8443

ENTRYPOINT ["/app/chapar-server"]
CMD ["-config", "/app/server_config.json"]
