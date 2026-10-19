#!/bin/bash
set -e

echo "=================================================="
echo "🚀 AutoTube AI: 1-Click Server Setup"
echo "=================================================="

# Update packages
sudo apt update -y

# Install Docker and prerequisites if not already installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

# Open Port 3000 in Oracle Cloud Ubuntu iptables firewall
echo "🔓 Opening Port 3000 in firewall..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 1 -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

echo "=================================================="
echo "✅ Server setup complete!"
echo "Run this command to start your 24/7 automation:"
echo "   docker compose up -d --build"
echo "=================================================="
