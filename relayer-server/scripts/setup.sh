#!/bin/bash

# Fusion Plus Relayer Server Setup Script
# This script sets up the relayer server by copying necessary contract artifacts

echo "🚀 Setting up Fusion Plus Relayer Server..."

# Create contracts directory if it doesn't exist
mkdir -p contracts

# Copy contract artifacts from the eth directory
echo "📋 Copying contract artifacts..."

# Copy TestEscrowFactory contract
if [ -f "../eth/dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json" ]; then
    cp ../eth/dist/contracts/TestEscrowFactory.sol/TestEscrowFactory.json contracts/
    echo "✅ Copied TestEscrowFactory.json"
else
    echo "⚠️  TestEscrowFactory.json not found. Please build the eth contracts first."
fi

# Copy Resolver contract
if [ -f "../eth/dist/contracts/Resolver.sol/Resolver.json" ]; then
    cp ../eth/dist/contracts/Resolver.sol/Resolver.json contracts/
    echo "✅ Copied Resolver.json"
else
    echo "⚠️  Resolver.json not found. Please build the eth contracts first."
fi

# Copy IERC20 contract
if [ -f "../eth/dist/contracts/IERC20.sol/IERC20.json" ]; then
    cp ../eth/dist/contracts/IERC20.sol/IERC20.json contracts/
    echo "✅ Copied IERC20.json"
else
    echo "⚠️  IERC20.json not found. Please build the eth contracts first."
fi

# Copy EscrowFactory contract
if [ -f "../eth/dist/contracts/EscrowFactory.sol/EscrowFactory.json" ]; then
    cp ../eth/dist/contracts/EscrowFactory.sol/EscrowFactory.json contracts/
    echo "✅ Copied EscrowFactory.json"
else
    echo "⚠️  EscrowFactory.json not found. Please build the eth contracts first."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    echo "✅ Created .env file. Please edit it with your configuration."
else
    echo "✅ .env file already exists."
fi

# Build the project
echo "🔨 Building the project..."
npm run build

echo ""
echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start the server: npm run dev"
echo "3. Test the relayer: npm run test"
echo ""
echo "For more information, see README.md" 