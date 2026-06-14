FROM python:3.12-slim

WORKDIR /app

RUN rm -f /etc/apt/sources.list.d/debian.sources && \
    echo "deb http://deb.debian.org/debian trixie main" > /etc/apt/sources.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends --allow-downgrades \
    libssl3t64=3.5.6-1~deb13u1 libssl-dev=3.5.6-1~deb13u1 && \
    apt-get install -y --no-install-recommends \
    gcc libpq-dev netcat-openbsd && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
