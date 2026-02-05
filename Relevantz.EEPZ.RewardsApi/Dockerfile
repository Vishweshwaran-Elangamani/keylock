# syntax=docker/dockerfile:1.6

#############################
# Stage 1: Build
#############################
FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine3.19 AS build
WORKDIR /src

ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_NOLOGO=1

COPY . .
RUN dotnet restore

WORKDIR /src/Relevantz.EEPZ.Api
RUN dotnet publish -c Release -o /app/publish

#############################
# Stage 2: Runtime
#############################
FROM mcr.microsoft.com/dotnet/aspnet:8.0-alpine3.19

# Globalization support
RUN apk add --no-cache icu-libs

# Create non-root user
RUN addgroup -S app || true \
    && adduser -S app -G app || true

# ✅ Create required directories with correct ownership
RUN mkdir -p /SharedUploads \
    && mkdir -p /home/app/.aspnet/DataProtection-Keys \
    && chown -R app:app /SharedUploads /home/app

WORKDIR /app
COPY --from=build /app/publish ./

RUN chown -R app:app /app

USER app

# ✅ Fix ALL warnings here
ENV ASPNETCORE_URLS=http://0.0.0.0:5114 \
    ASPNETCORE_DATA_PROTECTION__KEYS_DIR=/home/app/.aspnet/DataProtection-Keys \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false

EXPOSE 5114

ENTRYPOINT ["dotnet", "Relevantz.EEPZ.Api.dll"]